import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  listForStudent(studentId: string) {
    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        assignment: { select: { id: true, title: true, classId: true, maxScore: true } },
      },
      orderBy: { gradedAt: "desc" },
    });
  }

  async listForStudentAsTeacher(
    studentId: string,
    actorId: string,
    role: string,
  ) {
    if (role !== "ADMIN" && role !== "TEACHER" && actorId !== studentId) {
      throw new ForbiddenException("Sin permiso");
    }
    return this.listForStudent(studentId);
  }
}
