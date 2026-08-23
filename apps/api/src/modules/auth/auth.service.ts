import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role, User } from "@prisma/client";
import { LoginInput, RegisterInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createRefreshToken,
  hashPassword,
  hashToken,
  parseTtlToMs,
  verifyPassword,
} from "../../common/crypto";

type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  schoolId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException("El correo ya está registrado");
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        role: input.role as Role,
        passwordHash: await hashPassword(input.password),
      },
    });

    return this.issueTokens(user);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciales inválidas");
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toPublic(user);
  }

  private async issueTokens(user: User) {
    const accessSecret =
      process.env.JWT_ACCESS_SECRET ?? "change-me-access-secret-min-32-chars";
    const accessTtl = process.env.JWT_ACCESS_TTL ?? "15m";
    const refreshTtl = process.env.JWT_REFRESH_TTL ?? "7d";

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: accessSecret,
        expiresIn: accessTtl as `${number}m` | `${number}s` | `${number}h` | `${number}d`,
      },
    );

    const refreshToken = createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseTtlToMs(refreshTtl)),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toPublic(user),
    };
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      schoolId: user.schoolId,
    };
  }
}
