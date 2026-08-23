import { z } from "zod";

export const RoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);
export type Role = z.infer<typeof RoleSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["TEACHER", "STUDENT", "PARENT"]),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;
