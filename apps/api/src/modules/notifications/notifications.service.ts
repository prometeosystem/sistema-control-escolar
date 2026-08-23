import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  emailSubject?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async notify(input: NotifyInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!user) return null;

    let notification = null;
    if (user.inAppNotify) {
      notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: input.type,
          title: input.title,
          body: input.body,
          metadata: (input.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });
    }

    if (user.emailNotify) {
      // fire-and-forget async
      void this.mail.send({
        userId: user.id,
        to: user.email,
        subject: input.emailSubject ?? input.title,
        text: input.body,
        template: input.type,
      });
    }

    return notification;
  }

  async notifyMany(inputs: NotifyInput[]) {
    const results = [];
    for (const input of inputs) {
      results.push(await this.notify(input));
    }
    return results;
  }

  async list(userId: string, unreadOnly = false, page = 1, pageSize = 20) {
    const where = {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
        unreadCount: await this.prisma.notification.count({
          where: { userId, readAt: null },
        }),
      },
    };
  }

  async markRead(id: string, userId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!row) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
