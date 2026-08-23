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
