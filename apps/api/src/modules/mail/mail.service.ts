import { Injectable, Logger } from "@nestjs/common";
import { EmailStatus } from "@prisma/client";
import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { PrismaService } from "../../prisma/prisma.service";
import { decryptSecret } from "../../common/settings-crypto";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  template: string;
  userId?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveTransport(): Promise<{
    transporter: nodemailer.Transporter | null;
    from: string;
    source: "db" | "env" | "none";
  }> {
    const db = await this.prisma.smtpSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (db?.enabled && db.host) {
      const password = db.passwordEncrypted
        ? decryptSecret(db.passwordEncrypted)
        : undefined;
      const options: SMTPTransport.Options = {
        host: db.host,
        port: db.port,
        secure: db.secure,
        auth:
          db.username && password
            ? { user: db.username, pass: password }
            : undefined,
      };
      const from = db.fromName
        ? `"${db.fromName}" <${db.fromEmail}>`
        : db.fromEmail;
      return {
        transporter: nodemailer.createTransport(options),
        from,
        source: "db",
      };
    }

    const host = process.env.SMTP_HOST;
    if (host) {
      const options: SMTPTransport.Options = {
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      };
      return {
        transporter: nodemailer.createTransport(options),
        from: process.env.SMTP_FROM ?? "SCA <noreply@localhost>",
        source: "env",
      };
    }

    return { transporter: null, from: "", source: "none" };
  }

  async send(payload: MailPayload) {
    const { transporter, from, source } = await this.resolveTransport();
    if (!transporter) {
      this.logger.warn(`SMTP no configurado — skip mail to ${payload.to}`);
      await this.prisma.emailLog.create({
        data: {
          userId: payload.userId,
          to: payload.to,
          subject: payload.subject,
          template: payload.template,
          status: EmailStatus.skipped,
          error: "SMTP no configurado",
        },
      });
      return { ok: false, skipped: true };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? `<p>${payload.text}</p>`,
      });
      await this.prisma.emailLog.create({
        data: {
          userId: payload.userId,
          to: payload.to,
          subject: payload.subject,
          template: payload.template,
          status: EmailStatus.sent,
          providerMessageId: info.messageId,
        },
      });
      this.logger.log(`Mail enviado (${source}) → ${payload.to}`);
      return { ok: true, messageId: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.emailLog.create({
        data: {
          userId: payload.userId,
          to: payload.to,
          subject: payload.subject,
          template: payload.template,
          status: EmailStatus.failed,
          error: message,
        },
      });
      this.logger.error(`Mail falló → ${payload.to}: ${message}`);
      return { ok: false, error: message };
    }
  }
}
