import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttachmentKind, RoleInClass } from "@prisma/client";
import { CreatePostInput, UpdatePostInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByClass(classId: string, userId: string, role: string) {
    await this.assertMemberOrAdmin(classId, userId, role);
    return this.prisma.post.findMany({
      where: { classId },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    classId: string,
    authorId: string,
    role: string,
    input: CreatePostInput,
  ) {
    await this.assertTeacherOrAdmin(classId, authorId, role);

    if (input.attachmentIds?.length) {
      const count = await this.prisma.attachment.count({
        where: {
          id: { in: input.attachmentIds },
          uploadedById: authorId,
          postId: null,
          assignmentId: null,
          submissionId: null,
        },
      });
      if (count !== input.attachmentIds.length) {
        throw new ForbiddenException("Adjuntos inválidos");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          classId,
          authorId,
          title: input.title,
          body: input.body,
          unit: input.unit ?? null,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
        },
      });

      if (input.attachmentIds?.length) {
        await tx.attachment.updateMany({
          where: { id: { in: input.attachmentIds } },
          data: { postId: post.id },
        });
      }

      if (input.linkAttachments?.length) {
        await tx.attachment.createMany({
          data: input.linkAttachments.map((l) => ({
            kind: AttachmentKind.link,
            uploadedById: authorId,
            externalUrl: l.url,
            mimeType: "text/uri-list",
            size: 0,
            originalName: l.title,
            postId: post.id,
          })),
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: post.id },
        include: {
          author: { select: { id: true, fullName: true, email: true } },
          attachments: true,
        },
      });
    });
  }

  async getById(postId: string, userId: string, role: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        attachments: true,
      },
    });
    if (!post) throw new NotFoundException("Publicación no encontrada");
    await this.assertMemberOrAdmin(post.classId, userId, role);
    return post;
  }

  async update(postId: string, userId: string, role: string, input: UpdatePostInput) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Publicación no encontrada");
    await this.assertTeacherOrAdmin(post.classId, userId, role);

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.body ? { body: input.body } : {}),
        ...(input.unit !== undefined ? { unit: input.unit ?? null } : {}),
        ...(input.dueAt !== undefined
          ? { dueAt: input.dueAt ? new Date(input.dueAt) : null }
          : {}),
      },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        attachments: true,
      },
    });
  }

  async remove(postId: string, userId: string, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Publicación no encontrada");
    await this.assertTeacherOrAdmin(post.classId, userId, role);
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  private async assertMemberOrAdmin(classId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const membership = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (!membership) throw new ForbiddenException("No pertenecés a esta clase");
  }

  private async assertTeacherOrAdmin(classId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const membership = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (!membership || membership.roleInClass !== RoleInClass.teacher) {
      throw new ForbiddenException("Se requiere ser profesor de la clase");
    }
  }
}
