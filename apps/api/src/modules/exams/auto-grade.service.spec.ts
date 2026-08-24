import { AutoGradeService } from "./auto-grade.service";
import { AutoGradeProvider, QuestionType } from "@prisma/client";

describe("AutoGradeService", () => {
  const service = new AutoGradeService();

  it("califica multiple choice", async () => {
    const result = await service.gradeAnswer({
      type: QuestionType.multiple_choice,
      correctAnswer: { optionId: "b" },
      answer: { optionId: "b" },
      points: 2,
      autoGradeEnabled: true,
      provider: AutoGradeProvider.none,
    });
    expect(result.isCorrect).toBe(true);
    expect(result.pointsAwarded).toBe(2);
  });

  it("aplica crédito parcial por weightPercent", async () => {
    const result = await service.gradeAnswer({
      type: QuestionType.multiple_choice,
      correctAnswer: { optionId: "a" },
      answer: { optionId: "b" },
      points: 10,
      options: [
        { id: "a", text: "Bien", weightPercent: 100 },
        { id: "b", text: "Parcial", weightPercent: 50 },
        { id: "c", text: "Mal", weightPercent: 0 },
      ],
      autoGradeEnabled: true,
      provider: AutoGradeProvider.none,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.pointsAwarded).toBe(5);
  });

  it("marca paragraph para revisión manual", async () => {
    const result = await service.gradeAnswer({
      type: QuestionType.paragraph,
      correctAnswer: null,
      answer: { text: "hola" },
      points: 5,
      autoGradeEnabled: false,
      provider: AutoGradeProvider.none,
    });
    expect(result.needsManualReview).toBe(true);
  });

  it("gemini sin API key cae a manual", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await service.gradeAnswer({
      type: QuestionType.paragraph,
      correctAnswer: null,
      answer: { text: "hola" },
      points: 5,
      autoGradeEnabled: true,
      provider: AutoGradeProvider.gemini,
      model: "gemini-1.5-flash",
    });
    expect(result.needsManualReview).toBe(true);
    expect(result.feedback).toMatch(/GEMINI_API_KEY/);
  });
});
