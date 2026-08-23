import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AutoGradeProvider,
  ExamAttemptStatus,
  Prisma,
  QuestionType,
  RoleInClass,
} from "@prisma/client";
import {
  AnswerExamInput,
  CreateExamInput,
  ReplaceQuestionsInput,
  UpdateExamInput,
} from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AutoGradeService } from "./auto-grade.service";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoGrade: AutoGradeService,
  ) {}

  async listByClass(classId: string, userId: string, role: string) {
    await this.assertMemberOrAdmin(classId, userId, role);
    const isTeacher = await this.isTeacherOrAdmin(classId, userId, role);

    const exams = await this.prisma.exam.findMany({
      where: {
        classId,
        ...(isTeacher ? {} : { publishedAt: { not: null } }),
      },
      include: {
        _count: { select: { questions: true, attempts: true } },
        audience: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (isTeacher) return exams;

    return exams.filter((exam) => {
      if (!exam.restrictAudience) return true;
      return exam.audience.some((a) => a.studentId === userId);
    });
  }

  async create(classId: string, creatorId: string, role: string, input: CreateExamInput) {
    await this.assertTeacherOrAdmin(classId, creatorId, role);

    if (input.questionsPerAttempt > input.questions.length) {
      throw new BadRequestException(
        "questionsPerAttempt no puede ser mayor que el banco de preguntas",
      );
    }
    if (
      input.minPassingScore != null &&
      input.minPassingScore > input.maxScore
    ) {
      throw new BadRequestException("minPassingScore no puede superar maxScore");
    }

    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          classId,
          createdById: creatorId,
          title: input.title,
          description: input.description,
          timeLimitMin: input.timeLimitMin,
          maxScore: input.maxScore,
          minPassingScore: input.minPassingScore,
          maxAttempts: input.maxAttempts ?? null,
          questionsPerAttempt: input.questionsPerAttempt,
          shuffleQuestions: input.shuffleQuestions ?? true,
          shuffleOptions: input.shuffleOptions ?? true,
          restrictAudience: input.restrictAudience ?? false,
          allowFileAnswers: input.allowFileAnswers ?? true,
          showResultsToStudent: input.showResultsToStudent ?? true,
          autoGradeEnabled: input.autoGradeEnabled ?? false,
          autoGradeProvider: (input.autoGradeProvider ??
            "none") as AutoGradeProvider,
          autoGradeModel: input.autoGradeModel,
          opensAt: input.opensAt ? new Date(input.opensAt) : null,
          closesAt: input.closesAt ? new Date(input.closesAt) : null,
          questions: {
            create: input.questions.map((q, idx) => ({
              order: q.order ?? idx,
              type: q.type as QuestionType,
              prompt: q.prompt,
              options: q.options ?? Prisma.JsonNull,
              correctAnswer: q.correctAnswer ?? Prisma.JsonNull,
              points: q.points ?? 1,
              allowFileUpload:
                q.allowFileUpload ?? q.type === "file_upload",
              active: q.active ?? true,
            })),
          },
          ...(input.restrictAudience && input.allowedStudentIds?.length
            ? {
                audience: {
                  create: input.allowedStudentIds.map((studentId) => ({
                    studentId,
                  })),
                },
              }
            : {}),
        },
        include: { questions: true, audience: true },
      });
      return exam;
    });
  }

  async getById(id: string, userId: string, role: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        audience: true,
        _count: { select: { attempts: true } },
      },
    });
    if (!exam) throw new NotFoundException("Examen no encontrado");
    await this.assertMemberOrAdmin(exam.classId, userId, role);

    const isTeacher = await this.isTeacherOrAdmin(exam.classId, userId, role);
    if (!isTeacher) {
      if (!exam.publishedAt) throw new NotFoundException("Examen no encontrado");
      await this.assertCanTake(exam, userId);
      // Ocultar respuestas correctas al alumno
      return {
        ...exam,
        questions: exam.questions
          .filter((q) => q.active)
          .map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            points: q.points,
            allowFileUpload: q.allowFileUpload,
            // no enviamos correctAnswer ni el banco completo si no es intento
          })),
        bankSize: exam.questions.filter((q) => q.active).length,
        questionsPerAttempt: exam.questionsPerAttempt,
      };
    }
    return exam;
  }

  async update(id: string, userId: string, role: string, input: UpdateExamInput) {
    const exam = await this.requireExam(id);
    await this.assertTeacherOrAdmin(exam.classId, userId, role);

    if (
      input.questionsPerAttempt != null &&
      input.questionsPerAttempt > (await this.activeBankSize(id))
    ) {
      throw new BadRequestException(
        "questionsPerAttempt supera el banco activo",
      );
    }

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.timeLimitMin !== undefined
          ? { timeLimitMin: input.timeLimitMin }
          : {}),
        ...(input.maxScore != null ? { maxScore: input.maxScore } : {}),
        ...(input.minPassingScore !== undefined
          ? { minPassingScore: input.minPassingScore }
          : {}),
        ...(input.maxAttempts !== undefined
          ? { maxAttempts: input.maxAttempts }
          : {}),
        ...(input.questionsPerAttempt != null
          ? { questionsPerAttempt: input.questionsPerAttempt }
          : {}),
        ...(input.shuffleQuestions != null
          ? { shuffleQuestions: input.shuffleQuestions }
          : {}),
        ...(input.shuffleOptions != null
          ? { shuffleOptions: input.shuffleOptions }
          : {}),
        ...(input.restrictAudience != null
          ? { restrictAudience: input.restrictAudience }
          : {}),
        ...(input.allowFileAnswers != null
          ? { allowFileAnswers: input.allowFileAnswers }
          : {}),
        ...(input.showResultsToStudent != null
          ? { showResultsToStudent: input.showResultsToStudent }
          : {}),
        ...(input.autoGradeEnabled != null
          ? { autoGradeEnabled: input.autoGradeEnabled }
          : {}),
        ...(input.autoGradeProvider
          ? {
              autoGradeProvider: input.autoGradeProvider as AutoGradeProvider,
            }
          : {}),
        ...(input.autoGradeModel !== undefined
          ? { autoGradeModel: input.autoGradeModel }
          : {}),
        ...(input.opensAt !== undefined
          ? { opensAt: input.opensAt ? new Date(input.opensAt) : null }
          : {}),
        ...(input.closesAt !== undefined
          ? { closesAt: input.closesAt ? new Date(input.closesAt) : null }
          : {}),
      },
      include: { questions: true, audience: true },
    });
  }

  async replaceQuestions(
    id: string,
    userId: string,
    role: string,
    input: ReplaceQuestionsInput,
  ) {
    const exam = await this.requireExam(id);
    await this.assertTeacherOrAdmin(exam.classId, userId, role);
    if (exam.questionsPerAttempt > input.questions.length) {
      throw new BadRequestException(
        "El banco nuevo es más chico que questionsPerAttempt",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.examQuestion.deleteMany({ where: { examId: id } });
      await tx.examQuestion.createMany({
        data: input.questions.map((q, idx) => ({
          examId: id,
          order: q.order ?? idx,
          type: q.type as QuestionType,
          prompt: q.prompt,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer ?? undefined,
          points: q.points ?? 1,
          allowFileUpload: q.allowFileUpload ?? q.type === "file_upload",
          active: q.active ?? true,
        })),
      });
      return tx.exam.findUniqueOrThrow({
        where: { id },
        include: { questions: true },
      });
    });
  }

  async setAudience(
    id: string,
    userId: string,
    role: string,
    studentIds: string[],
  ) {
    const exam = await this.requireExam(id);
    await this.assertTeacherOrAdmin(exam.classId, userId, role);
    await this.prisma.$transaction([
      this.prisma.examAudience.deleteMany({ where: { examId: id } }),
      this.prisma.examAudience.createMany({
        data: studentIds.map((studentId) => ({ examId: id, studentId })),
      }),
      this.prisma.exam.update({
        where: { id },
        data: { restrictAudience: true },
      }),
    ]);
    return this.prisma.examAudience.findMany({ where: { examId: id } });
  }

  async publish(id: string, userId: string, role: string) {
    const exam = await this.requireExam(id);
    await this.assertTeacherOrAdmin(exam.classId, userId, role);
    const bank = await this.activeBankSize(id);
    if (bank < exam.questionsPerAttempt) {
      throw new BadRequestException("Banco insuficiente para publicar");
    }
    return this.prisma.exam.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  async startAttempt(examId: string, userId: string, role: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { where: { active: true } }, audience: true },
    });
    if (!exam || !exam.publishedAt) {
      throw new NotFoundException("Examen no disponible");
    }
    await this.assertMemberOrAdmin(exam.classId, userId, role);
    if (role !== "STUDENT" && role !== "ADMIN") {
      throw new ForbiddenException("Solo alumnos pueden presentar");
    }
    await this.assertCanTake(exam, userId);
    this.assertWindow(exam);

    const previous = await this.prisma.examAttempt.count({
      where: { examId, studentId: userId },
    });
    if (exam.maxAttempts != null && previous >= exam.maxAttempts) {
      throw new UnprocessableEntityException("Sin intentos restantes");
    }

    const inProgress = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: userId,
        status: ExamAttemptStatus.in_progress,
      },
    });
    if (inProgress) {
      return this.getAttemptForStudent(inProgress.id, userId);
    }

    const bank = exam.questions;
    if (bank.length < exam.questionsPerAttempt) {
      throw new BadRequestException("Banco de preguntas insuficiente");
    }

    const selected = (exam.shuffleQuestions ? shuffle(bank) : bank).slice(
      0,
      exam.questionsPerAttempt,
    );

    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.examAttempt.create({
        data: {
          examId,
          studentId: userId,
          attemptNo: previous + 1,
          status: ExamAttemptStatus.in_progress,
          maxScore: selected.reduce((s, q) => s + Number(q.points), 0),
        },
      });

      await tx.examAttemptQuestion.createMany({
        data: selected.map((q, position) => {
          let optionsOrder: Prisma.InputJsonValue | undefined;
          if (
            exam.shuffleOptions &&
            q.type === QuestionType.multiple_choice &&
            Array.isArray(q.options)
          ) {
            optionsOrder = shuffle(q.options as Array<{ id: string }>).map(
              (o) => o.id,
            );
          }
          return {
            attemptId: created.id,
            questionId: q.id,
            position,
            optionsOrder,
          };
        }),
      });

      return created;
    });

    return this.getAttemptForStudent(attempt.id, userId);
  }

  async answer(
    attemptId: string,
    userId: string,
    input: AnswerExamInput,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        questions: true,
      },
    });
    if (!attempt || attempt.studentId !== userId) {
      throw new NotFoundException("Intento no encontrado");
    }
    if (attempt.status !== ExamAttemptStatus.in_progress) {
      throw new UnprocessableEntityException("El intento ya fue enviado");
    }
    this.assertWindow(attempt.exam);

    const assigned = attempt.questions.find(
      (q) => q.questionId === input.questionId,
    );
    if (!assigned) {
      throw new BadRequestException("Pregunta no pertenece a este intento");
    }

    const question = await this.prisma.examQuestion.findUniqueOrThrow({
      where: { id: input.questionId },
    });

    if (
      (question.type === QuestionType.file_upload ||
        question.allowFileUpload) &&
      !attempt.exam.allowFileAnswers &&
      (input.attachmentIds?.length ?? 0) > 0
    ) {
      throw new BadRequestException("Este examen no admite archivos");
    }

    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.examAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: input.questionId,
          },
        },
        update: {
          answer: input.answer ?? Prisma.JsonNull,
        },
        create: {
          attemptId,
          questionId: input.questionId,
          answer: input.answer ?? Prisma.JsonNull,
        },
      });

      if (input.attachmentIds?.length) {
        await tx.attachment.updateMany({
          where: {
            id: { in: input.attachmentIds },
            uploadedById: userId,
            examAnswerId: null,
          },
          data: { examAnswerId: answer.id },
        });
      }

      return tx.examAnswer.findUniqueOrThrow({
        where: { id: answer.id },
        include: { attachments: true },
      });
    });
  }

  async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        questions: { include: { question: true } },
        answers: true,
      },
    });
    if (!attempt || attempt.studentId !== userId) {
      throw new NotFoundException("Intento no encontrado");
    }
    if (attempt.status !== ExamAttemptStatus.in_progress) {
      throw new UnprocessableEntityException("El intento ya fue enviado");
    }

    let total = 0;
    let max = 0;
    let needsManual = false;

    for (const item of attempt.questions) {
      const q = item.question;
      max += Number(q.points);
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      const graded = await this.autoGrade.gradeAnswer({
        type: q.type,
        correctAnswer: q.correctAnswer,
        answer: ans?.answer,
        points: Number(q.points),
        autoGradeEnabled: attempt.exam.autoGradeEnabled,
        provider: attempt.exam.autoGradeProvider,
        model: attempt.exam.autoGradeModel,
      });

      if (ans) {
        await this.prisma.examAnswer.update({
          where: { id: ans.id },
          data: {
            isCorrect: graded.isCorrect,
            pointsAwarded: graded.pointsAwarded,
            needsManualReview: graded.needsManualReview,
            autoGraded: graded.autoGraded,
            feedback: graded.feedback,
          },
        });
      }
      total += graded.pointsAwarded;
      if (graded.needsManualReview) needsManual = true;
    }

    const minPass = attempt.exam.minPassingScore
      ? Number(attempt.exam.minPassingScore)
      : null;
    const passed = minPass == null ? null : total >= minPass;

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: needsManual
          ? ExamAttemptStatus.submitted
          : ExamAttemptStatus.graded,
        submittedAt: new Date(),
        score: total,
        maxScore: max,
        passed,
      },
    });

    await this.prisma.grade.upsert({
      where: { examAttemptId: attemptId },
      update: {
        score: total,
        maxScore: max,
        passed,
        gradedById: attempt.exam.createdById,
        gradedAt: new Date(),
        feedback: needsManual ? "Pendiente revisión manual" : undefined,
      },
      create: {
        examAttemptId: attemptId,
        studentId: userId,
        score: total,
        maxScore: max,
        passed,
        gradedById: attempt.exam.createdById,
        feedback: needsManual ? "Pendiente revisión manual" : undefined,
      },
    });

    if (!attempt.exam.showResultsToStudent) {
      return {
        id: updated.id,
        status: updated.status,
        submittedAt: updated.submittedAt,
      };
    }

    return this.getAttemptForStudent(attemptId, userId, true);
  }

  async results(examId: string, userId: string, role: string) {
    const exam = await this.requireExam(examId);
    await this.assertTeacherOrAdmin(exam.classId, userId, role);
    return this.prisma.examAttempt.findMany({
      where: { examId, status: { not: ExamAttemptStatus.in_progress } },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        grade: true,
      },
      orderBy: [{ studentId: "asc" }, { attemptNo: "desc" }],
    });
  }

  async myResults(examId: string, userId: string) {
    const exam = await this.requireExam(examId);
    if (!exam.showResultsToStudent) {
      return { message: "Resultados ocultos por el profesor" };
    }
    return this.prisma.examAttempt.findMany({
      where: {
        examId,
        studentId: userId,
        status: { not: ExamAttemptStatus.in_progress },
      },
      orderBy: { attemptNo: "desc" },
    });
  }

  private async getAttemptForStudent(
    attemptId: string,
    userId: string,
    withResults = false,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        questions: {
          orderBy: { position: "asc" },
          include: { question: true },
        },
        answers: { include: { attachments: true } },
      },
    });
    if (!attempt || attempt.studentId !== userId) {
      throw new NotFoundException("Intento no encontrado");
    }

    return {
      id: attempt.id,
      examId: attempt.examId,
      attemptNo: attempt.attemptNo,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: withResults ? attempt.score : undefined,
      maxScore: attempt.maxScore,
      passed: withResults ? attempt.passed : undefined,
      timeLimitMin: attempt.exam.timeLimitMin,
      questions: attempt.questions.map((item) => {
        const q = item.question;
        let options = q.options as Array<{ id: string; text: string }> | null;
        if (
          options &&
          Array.isArray(item.optionsOrder) &&
          item.optionsOrder.length
        ) {
          const order = item.optionsOrder as string[];
          options = order
            .map((id) => options!.find((o) => o.id === id))
            .filter(Boolean) as Array<{ id: string; text: string }>;
        }
        const answer = attempt.answers.find((a) => a.questionId === q.id);
        return {
          questionId: q.id,
          position: item.position,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          allowFileUpload: q.allowFileUpload,
          options:
            q.type === QuestionType.multiple_choice ? options : undefined,
          answer: answer
            ? {
                value: answer.answer,
                attachments: answer.attachments,
                ...(withResults
                  ? {
                      isCorrect: answer.isCorrect,
                      pointsAwarded: answer.pointsAwarded,
                      feedback: answer.feedback,
                    }
                  : {}),
              }
            : null,
        };
      }),
    };
  }

  private async requireExam(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException("Examen no encontrado");
    return exam;
  }

  private async activeBankSize(examId: string) {
    return this.prisma.examQuestion.count({
      where: { examId, active: true },
    });
  }

  private assertWindow(exam: {
    opensAt: Date | null;
    closesAt: Date | null;
  }) {
    const now = Date.now();
    if (exam.opensAt && now < exam.opensAt.getTime()) {
      throw new UnprocessableEntityException("El examen aún no abre");
    }
    if (exam.closesAt && now > exam.closesAt.getTime()) {
      throw new UnprocessableEntityException("El examen ya cerró");
    }
  }

  private async assertCanTake(
    exam: {
      id: string;
      restrictAudience: boolean;
      audience?: Array<{ studentId: string }>;
    },
    userId: string,
  ) {
    if (!exam.restrictAudience) return;
    if (exam.audience) {
      if (!exam.audience.some((a) => a.studentId === userId)) {
        throw new ForbiddenException("No estás autorizado para este examen");
      }
      return;
    }
    const allowed = await this.prisma.examAudience.findUnique({
      where: {
        examId_studentId: { examId: exam.id, studentId: userId },
      },
    });
    if (!allowed) {
      throw new ForbiddenException("No estás autorizado para este examen");
    }
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
