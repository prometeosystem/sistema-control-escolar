import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ParentLinkStatus, Role } from "@prisma/client";
import { ParentLinkRequestInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async requestLink(parentId: string, parentRole: string, input: ParentLinkRequestInput) {
    if (parentRole !== "PARENT" && parentRole !== "ADMIN") {
      throw new ForbiddenException("Solo padres pueden solicitar vínculo");
    }
    const student = await this.prisma.user.findUnique({
      where: { email: input.studentEmail.toLowerCase() },
    });
    if (!student || student.role !== Role.STUDENT) {
      throw new NotFoundException("Alumno no encontrado con ese correo");
    }
    if (student.id === parentId) {
      throw new BadRequestException("No podés vincularte a vos mismo");
    }

    const existing = await this.prisma.parentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId: student.id },
      },
    });
    if (existing?.status === ParentLinkStatus.approved) {
      throw new ConflictException("Ya está vinculado a este alumno");
    }
    if (existing?.status === ParentLinkStatus.pending) {
      throw new ConflictException("Ya hay una solicitud pendiente");
    }

    const link = existing
      ? await this.prisma.parentLink.update({
          where: { id: existing.id },
          data: { status: ParentLinkStatus.pending },
          include: {
            student: { select: { id: true, fullName: true, email: true } },
            parent: { select: { id: true, fullName: true, email: true } },
          },
        })
      : await this.prisma.parentLink.create({
          data: {
            parentId,
            studentId: student.id,
            status: ParentLinkStatus.pending,
          },
          include: {
            student: { select: { id: true, fullName: true, email: true } },
            parent: { select: { id: true, fullName: true, email: true } },
          },
        });

    void this.notifications.notify({
      userId: student.id,
      type: "parent.link_request",
      title: "Solicitud de vínculo parental",
      body: `${link.parent.fullName} quiere vincularse como padre/tutor.`,
      metadata: { linkId: link.id, parentId },
      emailSubject: "[SCA] Solicitud de vínculo parental",
    });

    return link;
  }

  async listRequests(userId: string, role: string) {
    if (role === "ADMIN") {
      return this.prisma.parentLink.findMany({
        where: { status: ParentLinkStatus.pending },
        include: {
          parent: { select: { id: true, fullName: true, email: true } },
          student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    if (role === "PARENT") {
      return this.prisma.parentLink.findMany({
        where: { parentId: userId },
        include: {
          parent: { select: { id: true, fullName: true, email: true } },
          student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    if (role === "STUDENT") {
      return this.prisma.parentLink.findMany({
        where: { studentId: userId },
        include: {
          parent: { select: { id: true, fullName: true, email: true } },
          student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    throw new ForbiddenException();
  }

  async approve(linkId: string, actorId: string, role: string) {
    const link = await this.requirePending(linkId);
    if (role !== "ADMIN" && link.studentId !== actorId) {
      throw new ForbiddenException("Solo el alumno o un admin pueden aprobar");
    }
    const updated = await this.prisma.parentLink.update({
      where: { id: linkId },
      data: { status: ParentLinkStatus.approved },
      include: {
        parent: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, email: true } },
      },
    });
    void this.notifications.notify({
      userId: link.parentId,
      type: "parent.link_approved",
      title: "Vínculo aprobado",
      body: `Ya podés ver el progreso de ${updated.student.fullName}.`,
      metadata: { linkId, studentId: link.studentId },
      emailSubject: "[SCA] Vínculo parental aprobado",
    });
    return updated;
  }

  async reject(linkId: string, actorId: string, role: string) {
    const link = await this.requirePending(linkId);
    if (role !== "ADMIN" && link.studentId !== actorId) {
      throw new ForbiddenException("Solo el alumno o un admin pueden rechazar");
    }
    return this.prisma.parentLink.update({
      where: { id: linkId },
      data: { status: ParentLinkStatus.rejected },
      include: {
        parent: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async listChildren(parentId: string, role: string) {
    if (role === "ADMIN") {
      const links = await this.prisma.parentLink.findMany({
        where: { status: ParentLinkStatus.approved },
        include: {
          student: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      const uniq = new Map(links.map((l) => [l.student.id, l.student]));
      return [...uniq.values()];
    }
    const links = await this.prisma.parentLink.findMany({
      where: { parentId, status: ParentLinkStatus.approved },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return links.map((l) => l.student);
  }

  async childGrades(parentId: string, studentId: string, role: string) {
    if (role !== "ADMIN") {
      await this.assertApprovedParent(parentId, studentId);
    }
    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        assignment: {
          select: { id: true, title: true, classId: true, maxScore: true },
        },
      },
      orderBy: { gradedAt: "desc" },
    });
  }

  async childSubmissions(parentId: string, studentId: string, role: string) {
    if (role !== "ADMIN") {
      await this.assertApprovedParent(parentId, studentId);
    }
    return this.prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: {
          select: { id: true, title: true, classId: true, dueAt: true },
        },
        grade: true,
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  private async requirePending(id: string) {
    const link = await this.prisma.parentLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException("Solicitud no encontrada");
    if (link.status !== ParentLinkStatus.pending) {
      throw new BadRequestException("La solicitud ya fue resuelta");
    }
    return link;
  }

  private async assertApprovedParent(parentId: string, studentId: string) {
    const link = await this.prisma.parentLink.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
    if (!link || link.status !== ParentLinkStatus.approved) {
      throw new ForbiddenException("No tenés acceso a este alumno");
    }
  }
}
