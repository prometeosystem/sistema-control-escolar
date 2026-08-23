import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AssignmentMode,
  AttachmentKind,
  RoleInClass,
  SubmissionStatus,
} from "@prisma/client";
import { GradeSubmissionInput, SubmitAssignmentInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAssignment(assignmentId: string, userId: string, role: string) {
    const assignment = await this.requireAssignment(assignmentId);
    await this.assertTeacherOrAdmin(assignment.classId, userId, role);
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        team: { include: { members: true } },
        attachments: true,
        grade: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async mySubmission(assignmentId: string, userId: string, role: string) {
    const assignment = await this.requireAssignment(assignmentId);
    await this.assertMemberOrAdmin(assignment.classId, userId, role);

    if (assignment.mode === AssignmentMode.team) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { userId, team: { assignmentId } },
      });
      if (!membership) return null;
      return this.prisma.submission.findFirst({
        where: { assignmentId, teamId: membership.teamId },
        include: { attachments: true, grade: true, team: true },
      });
    }

    return this.prisma.submission.findFirst({
      where: { assignmentId, studentId: userId },
      include: { attachments: true, grade: true },
    });
  }

  async submit(
    assignmentId: string,
    userId: string,
    role: string,
    input: SubmitAssignmentInput,
  ) {
    const assignment = await this.requireAssignment(assignmentId);
    await this.assertMemberOrAdmin(assignment.classId, userId, role);

    if (role !== "STUDENT" && role !== "ADMIN") {
      throw new ForbiddenException("Solo alumnos pueden entregar");
    }

    if (!assignment.publishedAt) {
      throw new UnprocessableEntityException("La tarea no está publicada");
    }

    let teamId: string | null = null;
    let studentId: string | null = userId;

    if (assignment.mode === AssignmentMode.team) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { userId, team: { assignmentId } },
      });
      if (!membership) {
        throw new BadRequestException("No pertenecés a un equipo de esta tarea");
      }
      teamId = membership.teamId;
      studentId = null;
    }

    const existing = await this.prisma.submission.findFirst({
      where:
        assignment.mode === AssignmentMode.team
          ? { assignmentId, teamId: teamId! }
          : { assignmentId, studentId: userId },
    });

    return this.prisma.$transaction(async (tx) => {
      const submission = existing
        ? await tx.submission.update({
            where: { id: existing.id },
            data: {
              content: input.content,
              status: SubmissionStatus.submitted,
              submittedAt: new Date(),
            },
          })
        : await tx.submission.create({
            data: {
              assignmentId,
              studentId,
              teamId,
              content: input.content,
              status: SubmissionStatus.submitted,
              submittedAt: new Date(),
            },
          });

      if (input.attachmentIds?.length) {
        await tx.attachment.updateMany({
          where: {
            id: { in: input.attachmentIds },
            uploadedById: userId,
            submissionId: null,
          },
          data: { submissionId: submission.id },
        });
      }

      if (input.linkAttachments?.length) {
        await tx.attachment.createMany({
          data: input.linkAttachments.map((l) => ({
            kind: AttachmentKind.link,
            uploadedById: userId,
            externalUrl: l.url,
            mimeType: "text/uri-list",
            size: 0,
            originalName: l.title,
            submissionId: submission.id,
          })),
        });
      }

      return tx.submission.findUniqueOrThrow({
        where: { id: submission.id },
        include: { attachments: true, grade: true },
      });
    });
  }

  async grade(
    submissionId: string,
    graderId: string,
    role: string,
    input: GradeSubmissionInput,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, team: { include: { members: true } } },
    });
    if (!submission) throw new NotFoundException("Entrega no encontrada");
    await this.assertTeacherOrAdmin(submission.assignment.classId, graderId, role);

    const maxScore = Number(submission.assignment.maxScore);
    if (input.score > maxScore) {
      throw new BadRequestException(`La nota no puede superar ${maxScore}`);
    }

    const targets = submission.studentId
      ? [submission.studentId]
      : (submission.team?.members.map((m) => m.userId) ?? []);

    if (input.studentId && !targets.includes(input.studentId)) {
      throw new BadRequestException("El alumno no pertenece a esta entrega");
    }

    const primaryStudentId = input.studentId ?? targets[0];
    if (!primaryStudentId) {
      throw new BadRequestException("No hay alumno para calificar");
    }

    const grade = await this.prisma.grade.upsert({
      where: { submissionId },
      update: {
        score: input.score,
        maxScore,
        feedback: input.feedback,
        gradedById: graderId,
        gradedAt: new Date(),
        studentId: primaryStudentId,
      },
      create: {
        submissionId,
        assignmentId: submission.assignmentId,
        studentId: primaryStudentId,
        score: input.score,
        maxScore,
        feedback: input.feedback,
        gradedById: graderId,
      },
    });

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.graded },
    });

    for (const sid of targets) {
      if (sid === primaryStudentId) continue;
      const existing = await this.prisma.grade.findFirst({
        where: { assignmentId: submission.assignmentId, studentId: sid },
      });
      if (existing) {
        await this.prisma.grade.update({
          where: { id: existing.id },
          data: {
            score: input.score,
            maxScore,
            feedback: input.feedback,
            gradedById: graderId,
            gradedAt: new Date(),
          },
        });
      } else {
        await this.prisma.grade.create({
          data: {
            assignmentId: submission.assignmentId,
            studentId: sid,
            score: input.score,
            maxScore,
            feedback: input.feedback,
            gradedById: graderId,
          },
        });
      }
    }

    return grade;
  }

  private async requireAssignment(id: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Tarea no encontrada");
    return assignment;
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
