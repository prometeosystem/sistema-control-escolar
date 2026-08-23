import { z } from "zod";

export const UpdateSmtpSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  username: z.string().optional().nullable(),
  /** Si se omite o vacío, se conserva la contraseña guardada */
  password: z.string().min(1).optional().nullable(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1).default("SCA"),
});
export type UpdateSmtpSettingsInput = z.infer<typeof UpdateSmtpSettingsSchema>;

export const TestSmtpSchema = z.object({
  to: z.string().email(),
});
export type TestSmtpInput = z.infer<typeof TestSmtpSchema>;
