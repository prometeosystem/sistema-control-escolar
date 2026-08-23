import { z } from "zod";

export const ParentLinkRequestSchema = z.object({
  studentEmail: z.string().email(),
});
export type ParentLinkRequestInput = z.infer<typeof ParentLinkRequestSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["TEACHER", "STUDENT", "PARENT", "ADMIN"]),
  password: z.string().min(8),
  schoolId: z.string().uuid().optional().nullable(),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
