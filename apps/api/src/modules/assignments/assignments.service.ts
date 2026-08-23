import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssignmentMode,
  AttachmentKind,
  RoleInClass,
} from "@prisma/client";
import {
  CreateAssignmentInput,
  CreateTeamsInput,
  UpdateAssignmentInput,
} from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listByClass(classId: string, userId: string, role: string) {
    await this.assertMemberOrAdmin(classId, userId, role);
    const isTeacher = await this.isTeacherOrAdmin(classId, userId, role);

    return this.prisma.assignment.findMany({
      where: {
        classId,
        ...(isTeacher ? {} : { publishedAt: { not: null } }),
      },
      include: {
        _count: { select: { submissions: true, teams: true, attachments: true } },
        attachments: true,
      },
      orderBy: { dueAt: "asc" },
    });
  }

  async create(
    classId: string,
    creatorId: string,
    role: string,
    input: CreateAssignmentInput,
  ) {
    await this.assertTeacherOrAdmin(classId, creatorId, role);

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.create({
        data: {
          classId,
          createdById: creatorId,
          title: input.title,
          description: input.description,
          mode: input.mode as AssignmentMode,
          dueAt: new Date(input.dueAt),
          maxScore: input.maxScore,
        },
      });

      if (input.attachmentIds?.length) {
        await tx.attachment.updateMany({
          where: {
            id: { in: input.attachmentIds },
            uploadedById: creatorId,
            assignmentId: null,
            postId: null,
            submissionId: null,
          },
          data: { assignmentId: assignment.id },
        });
      }

      if (input.linkAttachments?.length) {
        await tx.attachment.createMany({
          data: input.linkAttachments.map((l) => ({
            kind: AttachmentKind.link,
            uploadedById: creatorId,
            externalUrl: l.url,
            mimeType: "text/uri-list",
            size: 0,
            originalName: l.title,
            assignmentId: assignment.id,
          })),
        });
      }

      return tx.assignment.findUniqueOrThrow({
        where: { id: assignment.id },
        include: { attachments: true },
      });
    });
  }

  async getById(id: string, userId: string, role: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        attachments: true,
        teams: { include: { members: true } },
        class: true,
      },
    });
    if (!assignment) throw new NotFoundException("Tarea no encontrada");
    await this.assertMemberOrAdmin(assignment.classId, userId, role);

    const isTeacher = await this.isTeacherOrAdmin(
      assignment.classId,
      userId,
      role,
    );
    if (!isTeacher && !assignment.publishedAt) {
      throw new NotFoundException("Tarea no encontrada");
    }
    return assignment;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    input: UpdateAssignmentInput,
  ) {
    const assignment = await this.getById(id, userId, role);
    await this.assertTeacherOrAdmin(assignment.classId, userId, role);

    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.mode ? { mode: input.mode as AssignmentMode } : {}),
        ...(input.dueAt ? { dueAt: new Date(input.dueAt) } : {}),
        ...(typeof input.maxScore === "number"
          ? { maxScore: input.maxScore }
          : {}),
      },
      include: { attachments: true },
    });
  }

  async publish(id: string, userId: string, role: string) {
    const assignment = await this.getById(id, userId, role);
    await this.assertTeacherOrAdmin(assignment.classId, userId, role);
    const updated = await this.prisma.assignment.update({
      where: { id },
      data: { publishedAt: new Date() },
    });

    const students = await this.prisma.classMembership.findMany({
      where: { classId: assignment.classId, roleInClass: RoleInClass.student },
      select: { userId: true },
    });
    void this.notifications.notifyMany(
      students.map((s) => ({
        userId: s.userId,
        type: "assignment.published",
        title: `Nueva tarea: ${assignment.title}`,
        body: `Se publicó una tarea con entrega el ${new Date(assignment.dueAt).toLocaleString("es-MX")}.`,
        metadata: { assignmentId: assignment.id, classId: assignment.classId },
        emailSubject: `[SCA] Nueva tarea: ${assignment.title}`,
      })),
    );

    return updated;
  }

  async remove(id: string, userId: string, role: string) {
    const assignment = await this.getById(id, userId, role);
    await this.assertTeacherOrAdmin(assignment.classId, userId, role);
    await this.prisma.assignment.delete({ where: { id } });
    return { ok: true };
  }

  async createTeams(
    assignmentId: string,
    userId: string,
    role: string,
    input: CreateTeamsInput,
  ) {
    const assignment = await this.getById(assignmentId, userId, role);
    await this.assertTeacherOrAdmin(assignment.classId, userId, role);
    if (assignment.mode !== AssignmentMode.team) {
      throw new BadRequestException("La tarea no es por equipos");
    }

    return this.prisma.$transaction(async (tx) => {
      const created = [];
      for (const team of input.teams) {
        const row = await tx.team.create({
          data: {
            assignmentId,
            name: team.name,
            members: {
              create: team.memberIds.map((memberId) => ({ userId: memberId })),
            },
          },
          include: { members: true },
        });
        created.push(row);
      }
      return created;
    });
  }

  async listTeams(assignmentId: string, userId: string, role: string) {
    const assignment = await this.getById(assignmentId, userId, role);
    await this.assertMemberOrAdmin(assignment.classId, userId, role);
    return this.prisma.team.findMany({
      where: { assignmentId },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
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

  private async isTeacherOrAdmin(classId: string, userId: string, role: string) {
    if (role === "ADMIN") return true;
    const membership = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    return membership?.roleInClass === RoleInClass.teacher;
  }
}
