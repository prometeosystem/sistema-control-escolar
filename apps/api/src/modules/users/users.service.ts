import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import {
  NotificationPreferencesInput,
  UpdateProfileInput,
} from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    role?: string;
    q?: string;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(params.role ? { role: params.role as Role } : {}),
      ...(params.q
        ? {
            OR: [
              { email: { contains: params.q, mode: "insensitive" as const } },
              { fullName: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          schoolId: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize) || 1,
      },
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        schoolId: true,
        emailNotify: true,
        inAppNotify: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user;
  }

  async updateProfile(id: string, input: UpdateProfileInput) {
    return this.prisma.user.update({
      where: { id },
      data: { ...input },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        schoolId: true,
      },
    });
  }

  async updateNotificationPreferences(
    id: string,
    input: NotificationPreferencesInput,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: { ...input },
      select: {
        id: true,
        emailNotify: true,
        inAppNotify: true,
      },
    });
  }

  async updateRole(id: string, role: Role | string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }
}
