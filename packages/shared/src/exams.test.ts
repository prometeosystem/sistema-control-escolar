import { describe, expect, it } from "vitest";
import { CreateExamSchema } from "./exams";

describe("CreateExamSchema", () => {
  it("valida banco y questionsPerAttempt", () => {
    const data = CreateExamSchema.parse({
      title: "Quiz 1",
      questionsPerAttempt: 2,
      maxScore: 10,
      minPassingScore: 6,
      maxAttempts: 3,
      shuffleQuestions: true,
      questions: [
        {
          type: "multiple_choice",
          prompt: "2+2?",
          options: [
            { id: "a", text: "3" },
            { id: "b", text: "4" },
          ],
          correctAnswer: { optionId: "b" },
          points: 5,
        },
        {
          type: "true_false",
          prompt: "La Tierra es redonda",
          correctAnswer: { value: true },
          points: 5,
        },
        {
          type: "paragraph",
          prompt: "Explica...",
          allowFileUpload: true,
          points: 5,
        },
      ],
    });
    expect(data.questions).toHaveLength(3);
    expect(data.questionsPerAttempt).toBe(2);
  });
});
