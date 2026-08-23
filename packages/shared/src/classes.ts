import { z } from "zod";

export const CreateClassSchema = z.object({
  name: z.string().min(2),
  section: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  cycleId: z.string().uuid(),
  schoolId: z.string().uuid().optional(),
});
export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = CreateClassSchema.partial().omit({
  cycleId: true,
  schoolId: true,
});
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

export const JoinClassSchema = z.object({
  joinCode: z.string().min(4).max(16),
});
export type JoinClassInput = z.infer<typeof JoinClassSchema>;

export const AddTeacherSchema = z.object({
  userId: z.string().uuid(),
});
export type AddTeacherInput = z.infer<typeof AddTeacherSchema>;

export const CreatePostSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(1),
  attachmentIds: z.array(z.string().uuid()).optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = CreatePostSchema.partial();
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export const PresignFileSchema = z.object({
  originalName: z.string().min(1),
  mimeType: z.string().min(3),
  size: z.number().int().positive().max(25 * 1024 * 1024),
  purpose: z.enum(["post", "assignment", "submission", "other"]).default("other"),
});
export type PresignFileInput = z.infer<typeof PresignFileSchema>;

export const ConfirmFileSchema = z.object({
  storagePath: z.string().min(3),
  originalName: z.string().min(1),
  mimeType: z.string().min(3),
  size: z.number().int().positive().max(25 * 1024 * 1024),
});
export type ConfirmFileInput = z.infer<typeof ConfirmFileSchema>;
