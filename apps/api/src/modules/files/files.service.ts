import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfirmFileInput, PresignFileInput } from "@sca/shared";
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
        uploadedById: userId,
        storagePath: input.storagePath,
        bucket: this.storage.getBucketName(),
        mimeType: input.mimeType,
        size: input.size,
        originalName: input.originalName,
      },
    });
  }

  async getForUser(fileId: string, userId: string, role: string) {
    const file = await this.prisma.attachment.findUnique({
      where: { id: fileId },
      include: { post: true },
    });
    if (!file) throw new NotFoundException("Archivo no encontrado");

    const allowed = await this.canAccess(file, userId, role);
    if (!allowed) throw new ForbiddenException("Sin acceso al archivo");

    const downloadUrl = await this.storage.getSignedDownloadUrl(file.storagePath);
    return { ...file, downloadUrl };
  }

  async remove(fileId: string, userId: string, role: string) {
    const file = await this.prisma.attachment.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException("Archivo no encontrado");

    if (role !== "ADMIN" && file.uploadedById !== userId) {
      throw new ForbiddenException("Solo el dueño o admin puede borrar");
    }

    await this.storage.delete(file.storagePath);
    await this.prisma.attachment.delete({ where: { id: fileId } });
    return { ok: true };
  }

  private async canAccess(
    file: {
      uploadedById: string;
      postId: string | null;
      post: { classId: string } | null;
    },
    userId: string,
    role: string,
  ) {
    if (role === "ADMIN" || file.uploadedById === userId) return true;
    if (!file.postId || !file.post) return false;
    const membership = await this.prisma.classMembership.findUnique({
      where: {
        classId_userId: { classId: file.post.classId, userId },
      },
    });
    return Boolean(membership);
  }
}
