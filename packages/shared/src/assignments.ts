import { z } from "zod";
import {
  ALLOWED_FILE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  isAllowedFileMime,
} from "./files";

export const CreateAssignmentSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  mode: z.enum(["individual", "team"]).default("individual"),
  dueAt: z.string().min(4),
  maxScore: z.number().positive().max(1000),
  attachmentIds: z.array(z.string().uuid()).optional(),
  linkAttachments: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().min(1).max(200),
      }),
    )
    .optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

export const CreateTeamsSchema = z.object({
  teams: z
    .array(
      z.object({
        name: z.string().min(1),
        memberIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .min(1),
});
export type CreateTeamsInput = z.infer<typeof CreateTeamsSchema>;

export const SubmitAssignmentSchema = z.object({
  content: z.string().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  linkAttachments: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().min(1).max(200),
      }),
    )
    .optional(),
});
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

export const GradeSubmissionSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().max(5000).optional(),
  studentId: z.string().uuid().optional(),
});
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>;

export const PresignFileSchema = z
  .object({
    originalName: z.string().min(1),
    mimeType: z.string().min(3),
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
    purpose: z
      .enum(["post", "assignment", "submission", "other"])
      .default("other"),
  })
  .superRefine((val, ctx) => {
    if (!isAllowedFileMime(val.mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tipo no permitido. Usa: ${ALLOWED_FILE_MIME_TYPES.join(", ")}`,
        path: ["mimeType"],
      });
    }
  });
export type PresignFileInput = z.infer<typeof PresignFileSchema>;

export const ConfirmFileSchema = z
  .object({
    storagePath: z.string().min(3),
    originalName: z.string().min(1),
    mimeType: z.string().min(3),
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  })
  .superRefine((val, ctx) => {
    if (!isAllowedFileMime(val.mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tipo de archivo no permitido",
        path: ["mimeType"],
      });
    }
  });
export type ConfirmFileInput = z.infer<typeof ConfirmFileSchema>;

export const CreateLinkAttachmentSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  purpose: z.enum(["post", "assignment", "submission", "other"]).default("other"),
});
export type CreateLinkAttachmentInput = z.infer<typeof CreateLinkAttachmentSchema>;
