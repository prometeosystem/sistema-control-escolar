import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role, RoleInClass } from "@prisma/client";
import {
  AddTeacherInput,
  CreateClassInput,
  JoinClassInput,
  UpdateClassInput,
} from "@sca/shared";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, role: string) {
    if (role === "ADMIN") {
      return this.prisma.class.findMany({
        where: { archivedAt: null },
        include: {
          memberships: { include: { user: { select: { id: true, fullName: true, email: true, role: true } } } },
          _count: { select: { memberships: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return this.prisma.class.findMany({
      where: {
        archivedAt: null,
        memberships: { some: { userId } },
      },
      include: {
        memberships: {
          where: { userId },
          select: { roleInClass: true },
        },
        _count: { select: { memberships: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(actorId: string, actorRole: string, input: CreateClassInput) {
    if (actorRole !== "TEACHER" && actorRole !== "ADMIN") {
      throw new ForbiddenException("Solo profesores o admin pueden crear clases");
    }

    const cycle = await this.prisma.academicCycle.findUnique({
      where: { id: input.cycleId },
    });
    if (!cycle) throw new NotFoundException("Ciclo no encontrado");

    const schoolId = input.schoolId ?? cycle.schoolId;
    const joinCode = await this.generateUniqueJoinCode();

    return this.prisma.class.create({
      data: {
        name: input.name,
        section: input.section,
        subject: input.subject,
        cycleId: input.cycleId,
        schoolId,
        joinCode,
        memberships: {
          create: {
            userId: actorId,
            roleInClass: RoleInClass.teacher,
          },
        },
      },
      include: { memberships: true },
    });
  }

  async getById(classId: string, userId: string, role: string) {
    await this.assertMemberOrAdmin(classId, userId, role);
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
        cycle: true,
      },
    });
    if (!classroom || classroom.archivedAt) {
      throw new NotFoundException("Clase no encontrada");
    }
    return classroom;
  }

  async update(
    classId: string,
    userId: string,
    role: string,
    input: UpdateClassInput,
  ) {
    await this.assertTeacherOrAdmin(classId, userId, role);
    return this.prisma.class.update({
      where: { id: classId },
      data: input,
    });
  }

  async archive(classId: string, userId: string, role: string) {
    await this.assertTeacherOrAdmin(classId, userId, role);
    return this.prisma.class.update({
      where: { id: classId },
      data: { archivedAt: new Date() },
    });
  }

  async join(userId: string, role: string, input: JoinClassInput) {
    if (role !== "STUDENT" && role !== "ADMIN") {
      throw new ForbiddenException("Solo alumnos pueden unirse con código");
    }
    const classroom = await this.prisma.class.findUnique({
      where: { joinCode: input.joinCode.toUpperCase() },
    });
    if (!classroom || classroom.archivedAt) {
      throw new NotFoundException("Código de clase inválido");
    }

    const existing = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId: classroom.id, userId } },
    });
    if (existing) return { class: classroom, membership: existing };

    const membership = await this.prisma.classMembership.create({
      data: {
        classId: classroom.id,
        userId,
        roleInClass: RoleInClass.student,
      },
    });
    return { class: classroom, membership };
  }

  async listMembers(classId: string, userId: string, role: string) {
    await this.assertMemberOrAdmin(classId, userId, role);
    return this.prisma.classMembership.findMany({
      where: { classId },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: [{ roleInClass: "asc" }, { createdAt: "asc" }],
    });
  }

  async addTeacher(
    classId: string,
    actorId: string,
    actorRole: string,
    input: AddTeacherInput,
  ) {
    await this.assertTeacherOrAdmin(classId, actorId, actorRole);
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
      throw new BadRequestException("El usuario debe ser profesor");
    }

    return this.prisma.classMembership.upsert({
      where: { classId_userId: { classId, userId: input.userId } },
      update: { roleInClass: RoleInClass.teacher },
      create: {
        classId,
        userId: input.userId,
        roleInClass: RoleInClass.teacher,
      },
    });
  }

  async removeMember(
    classId: string,
    targetUserId: string,
    actorId: string,
    actorRole: string,
  ) {
    await this.assertTeacherOrAdmin(classId, actorId, actorRole);
    await this.prisma.classMembership.delete({
      where: { classId_userId: { classId, userId: targetUserId } },
    });
    return { ok: true };
  }

  private async generateUniqueJoinCode() {
    for (let i = 0; i < 8; i++) {
      const code = randomBytes(3).toString("hex").toUpperCase();
      const exists = await this.prisma.class.findUnique({ where: { joinCode: code } });
      if (!exists) return code;
    }
    throw new BadRequestException("No se pudo generar código de clase");
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
