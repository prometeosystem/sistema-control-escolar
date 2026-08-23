import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { InviteUserInput } from "@sca/shared";
import { hashPassword } from "../../common/crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async stats() {
    const [
      users,
      teachers,
      students,
      parents,
      classes,
      assignments,
      submissions,
      exams,
      pendingLinks,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.PARENT } }),
      this.prisma.class.count(),
      this.prisma.assignment.count(),
      this.prisma.submission.count(),
      this.prisma.exam.count(),
      this.prisma.parentLink.count({ where: { status: "pending" } }),
    ]);

    return {
      users,
      teachers,
      students,
      parents,
      classes,
      assignments,
      submissions,
      exams,
      pendingParentLinks: pendingLinks,
    };
  }

  async invite(input: InviteUserInput) {
    const email = input.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("El correo ya está registrado");
    }
    if (input.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: input.schoolId },
      });
      if (!school) throw new NotFoundException("Escuela no encontrada");
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName,
        role: input.role as Role,
        passwordHash: await hashPassword(input.password),
        schoolId: input.schoolId ?? null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        schoolId: true,
        createdAt: true,
      },
    });

    void this.mail.send({
      userId: user.id,
      to: user.email,
      subject: "SCA — cuenta creada",
      text: `Hola ${user.fullName}, tu cuenta (${user.role}) fue creada. Iniciá sesión con este correo y la contraseña que te compartió el administrador.`,
      template: "admin.invite",
    });

    return user;
  }
}
