import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UpdateSmtpSettingsInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { encryptSecret } from "../../common/settings-crypto";
import { MailService } from "./mail.service";

@Injectable()
export class SmtpSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async getPublic() {
    const row = await this.prisma.smtpSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    if (!row) {
      return {
        configured: false,
        enabled: false,
        host: "",
        port: 587,
        secure: false,
        username: "",
        fromEmail: "",
        fromName: "SCA",
        hasPassword: false,
        sourceHint: process.env.SMTP_HOST ? "env-fallback" : "none",
      };
    }
    return {
      configured: true,
      enabled: row.enabled,
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username ?? "",
      fromEmail: row.fromEmail,
      fromName: row.fromName,
      hasPassword: Boolean(row.passwordEncrypted),
      updatedAt: row.updatedAt,
      sourceHint: "database",
    };
  }

  async upsert(adminId: string, input: UpdateSmtpSettingsInput) {
    const existing = await this.prisma.smtpSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    let passwordEncrypted = existing?.passwordEncrypted ?? null;
    if (input.password && input.password.trim().length > 0) {
      passwordEncrypted = encryptSecret(input.password.trim());
    }

    if (!passwordEncrypted && input.enabled) {
      // allow enabled without password for open relays (rare)
    }

    const data = {
      enabled: input.enabled,
      host: input.host,
      port: input.port,
      secure: input.secure,
      username: input.username ?? null,
      passwordEncrypted,
      fromEmail: input.fromEmail,
      fromName: input.fromName,
      updatedById: adminId,
    };

    if (existing) {
      return this.prisma.smtpSettings.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.smtpSettings.create({ data });
  }

  async test(adminRole: string, to: string) {
    if (adminRole !== "ADMIN") {
      throw new ForbiddenException();
    }
    const result = await this.mail.send({
      to,
      subject: "SCA — prueba SMTP",
      text: "Si recibiste este correo, la configuración SMTP funciona.",
      template: "smtp.test",
    });
    if (!result.ok) {
      throw new BadRequestException(
        ("error" in result && result.error) ||
          ("skipped" in result && result.skipped
            ? "SMTP no configurado o deshabilitado"
            : "No se pudo enviar"),
      );
    }
    return result;
  }
}
