import { z } from "zod";

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const NotificationPreferencesSchema = z.object({
  emailNotify: z.boolean().optional(),
  inAppNotify: z.boolean().optional(),
});
export type NotificationPreferencesInput = z.infer<
  typeof NotificationPreferencesSchema
>;

export const CreateSchoolSchema = z.object({
  name: z.string().min(2),
});
export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;

export const CreateCycleSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(2),
  startsAt: z.string().min(4),
  endsAt: z.string().min(4),
  isActive: z.boolean().optional(),
});
export type CreateCycleInput = z.infer<typeof CreateCycleSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
