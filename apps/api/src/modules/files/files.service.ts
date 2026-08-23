import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttachmentKind } from "@prisma/client";
import {
  ConfirmFileInput,
  CreateLinkAttachmentInput,
  PresignFileInput,
} from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "./storage.service";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async presign(userId: string, input: PresignFileInput) {
    const storagePath = this.storage.buildStoragePath(
      userId,
      input.originalName,
      input.purpose,
    );
    const target = await this.storage.createUploadUrl(storagePath);
    return {
      ...target,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    };
  }

  async confirm(userId: string, input: ConfirmFileInput) {
    const exists = await this.storage.assertObjectExists(input.storagePath);
    if (!exists) {
      throw new NotFoundException("El archivo no existe en storage");
    }

    return this.prisma.attachment.create({
      data: {
        kind: AttachmentKind.file,
        uploadedById: userId,
        storagePath: input.storagePath,
        bucket: this.storage.getBucketName(),
        mimeType: input.mimeType,
        size: input.size,
        originalName: input.originalName,
      },
    });
  }

  async createLink(userId: string, input: CreateLinkAttachmentInput) {
    try {
      // Validate URL shape already done by Zod; block javascript: etc.
      const url = new URL(input.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new BadRequestException("Solo se permiten links http/https");
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException("URL inválida");
    }

    return this.prisma.attachment.create({
      data: {
        kind: AttachmentKind.link,
        uploadedById: userId,
        externalUrl: input.url,
        mimeType: "text/uri-list",
        size: 0,
        originalName: input.title,
      },
    });
  }

  async getForUser(fileId: string, userId: string, role: string) {
    const file = await this.prisma.attachment.findUnique({
      where: { id: fileId },
      include: {
        post: true,
        assignment: true,
        submission: { include: { assignment: true } },
        examAnswer: {
          include: { attempt: { include: { exam: true } } },
        },
      },
    });
    if (!file) throw new NotFoundException("Archivo no encontrado");

    const allowed = await this.canAccess(file, userId, role);
    if (!allowed) throw new ForbiddenException("Sin acceso al archivo");

    if (file.kind === AttachmentKind.link) {
      return { ...file, downloadUrl: file.externalUrl };
    }

    if (!file.storagePath) {
      throw new NotFoundException("Archivo sin path de storage");
    }

    const downloadUrl = await this.storage.getSignedDownloadUrl(file.storagePath);
    return { ...file, downloadUrl };
  }

  async remove(fileId: string, userId: string, role: string) {
    const file = await this.prisma.attachment.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException("Archivo no encontrado");

    if (role !== "ADMIN" && file.uploadedById !== userId) {
      throw new ForbiddenException("Solo el dueño o admin puede borrar");
    }

    if (file.kind === AttachmentKind.file && file.storagePath) {
      await this.storage.delete(file.storagePath);
    }
    await this.prisma.attachment.delete({ where: { id: fileId } });
    return { ok: true };
  }

  private async canAccess(
    file: {
      uploadedById: string;
      postId: string | null;
      assignmentId: string | null;
      submissionId: string | null;
      examAnswerId: string | null;
      post: { classId: string } | null;
      assignment: { classId: string } | null;
      submission: { assignment: { classId: string } } | null;
      examAnswer: { attempt: { exam: { classId: string } } } | null;
    },
    userId: string,
    role: string,
  ) {
    if (role === "ADMIN" || file.uploadedById === userId) return true;

    const classId =
      file.post?.classId ??
      file.assignment?.classId ??
      file.submission?.assignment.classId ??
      file.examAnswer?.attempt.exam.classId;
    if (!classId) return false;

    const membership = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    return Boolean(membership);
  }
}
