import { z } from "zod";

export const QuestionTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "short_answer",
  "paragraph",
  "file_upload",
]);

export const ExamQuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  /** Porcentaje del puntaje de la pregunta (0–100). Si falta, se autoasigna. */
  weightPercent: z.number().min(0).max(100).optional(),
});

export const ExamQuestionSchema = z.object({
  type: QuestionTypeSchema,
  prompt: z.string().min(1),
  options: z.array(ExamQuestionOptionSchema).optional(),
  correctAnswer: z.any().optional(),
  points: z.number().positive().max(1000).default(1),
  allowFileUpload: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const CreateExamSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  timeLimitMin: z.number().int().positive().optional(),
  maxScore: z.number().positive().max(10000).default(100),
  minPassingScore: z.number().min(0).optional(),
  maxAttempts: z.number().int().positive().nullable().optional(),
  questionsPerAttempt: z.number().int().positive(),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  restrictAudience: z.boolean().default(false),
  allowedStudentIds: z.array(z.string().uuid()).optional(),
  allowFileAnswers: z.boolean().default(true),
  showResultsToStudent: z.boolean().default(true),
  autoGradeEnabled: z.boolean().default(false),
  autoGradeProvider: z.enum(["none", "gemini"]).default("none"),
  autoGradeModel: z.string().optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
  questions: z.array(ExamQuestionSchema).min(1),
});
export type CreateExamInput = z.infer<typeof CreateExamSchema>;

export const UpdateExamSchema = CreateExamSchema.partial().omit({
  questions: true,
});
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;

export const ReplaceQuestionsSchema = z.object({
  questions: z.array(ExamQuestionSchema).min(1),
});
export type ReplaceQuestionsInput = z.infer<typeof ReplaceQuestionsSchema>;

export const AnswerExamSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.any().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});
export type AnswerExamInput = z.infer<typeof AnswerExamSchema>;
