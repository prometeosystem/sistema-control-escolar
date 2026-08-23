import { Injectable, Logger } from "@nestjs/common";
import { AutoGradeProvider, QuestionType } from "@prisma/client";

export type AutoGradeResult = {
  isCorrect: boolean | null;
  pointsAwarded: number;
  needsManualReview: boolean;
  feedback?: string;
  autoGraded: boolean;
};

@Injectable()
export class AutoGradeService {
  private readonly logger = new Logger(AutoGradeService.name);

  /**
   * Calificación automática local (opciones / V-F / short exacto).
   * Gemini queda parametrizable: si provider=gemini y hay GEMINI_API_KEY,
   * en el futuro se enviará paragraph/short aquí. Hoy hace fallback a manual.
   */
  async gradeAnswer(params: {
    type: QuestionType;
    correctAnswer: unknown;
    answer: unknown;
    points: number;
    autoGradeEnabled: boolean;
    provider: AutoGradeProvider;
    model?: string | null;
  }): Promise<AutoGradeResult> {
    const points = Number(params.points);

    if (
      params.type === QuestionType.paragraph ||
      params.type === QuestionType.file_upload
    ) {
      if (
        params.autoGradeEnabled &&
        params.provider === AutoGradeProvider.gemini
      ) {
        return this.gradeWithGeminiPlaceholder(params, points);
      }
      return {
        isCorrect: null,
        pointsAwarded: 0,
        needsManualReview: true,
        autoGraded: false,
        feedback: "Requiere revisión manual",
      };
    }

    if (params.type === QuestionType.multiple_choice) {
      const expected = String(
        (params.correctAnswer as { optionId?: string })?.optionId ??
          params.correctAnswer ??
          "",
      );
      const given = String(
        (params.answer as { optionId?: string })?.optionId ?? params.answer ?? "",
      );
      const ok = expected.length > 0 && expected === given;
      return {
        isCorrect: ok,
        pointsAwarded: ok ? points : 0,
        needsManualReview: false,
        autoGraded: true,
      };
    }

    if (params.type === QuestionType.true_false) {
      const expected = Boolean(
        (params.correctAnswer as { value?: boolean })?.value ??
          params.correctAnswer,
      );
      const given = Boolean(
        (params.answer as { value?: boolean })?.value ?? params.answer,
      );
      const ok = expected === given;
      return {
        isCorrect: ok,
        pointsAwarded: ok ? points : 0,
        needsManualReview: false,
        autoGraded: true,
      };
    }

    if (params.type === QuestionType.short_answer) {
      const expected = String(
        (params.correctAnswer as { text?: string })?.text ??
          params.correctAnswer ??
          "",
      )
        .trim()
        .toLowerCase();
      const given = String(
        (params.answer as { text?: string })?.text ?? params.answer ?? "",
      )
        .trim()
        .toLowerCase();
      if (!expected) {
        return {
          isCorrect: null,
          pointsAwarded: 0,
          needsManualReview: true,
          autoGraded: false,
        };
      }
      const ok = expected === given;
      return {
        isCorrect: ok,
        pointsAwarded: ok ? points : 0,
        needsManualReview: false,
        autoGraded: true,
      };
    }

    return {
      isCorrect: null,
      pointsAwarded: 0,
      needsManualReview: true,
      autoGraded: false,
    };
  }

  private gradeWithGeminiPlaceholder(
    params: { model?: string | null },
    points: number,
  ): AutoGradeResult {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      this.logger.warn(
        "autoGradeProvider=gemini pero falta GEMINI_API_KEY — revisión manual",
      );
      return {
        isCorrect: null,
        pointsAwarded: 0,
        needsManualReview: true,
        autoGraded: false,
        feedback: "Gemini no configurado (GEMINI_API_KEY)",
      };
    }
    // Hook futuro: llamar Gemini con params.model
    this.logger.log(
      `Gemini hook listo (model=${params.model ?? "default"}) — pendiente integración`,
    );
    return {
      isCorrect: null,
      pointsAwarded: 0,
      needsManualReview: true,
      autoGraded: false,
      feedback: `Pendiente integración Gemini (${params.model ?? "default"})`,
    };
  }
}
