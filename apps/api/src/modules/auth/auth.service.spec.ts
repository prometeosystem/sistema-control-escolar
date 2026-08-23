import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn().mockResolvedValue("access.jwt.token"),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwt as unknown as JwtService);
  });

  it("register crea usuario y tokens", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "u1",
      email: "a@test.com",
      fullName: "Ana",
      role: Role.STUDENT,
      schoolId: null,
      passwordHash: "hash",
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await service.register({
      email: "a@test.com",
      password: "secreto12",
      fullName: "Ana",
      role: "STUDENT",
    });

    expect(result.accessToken).toBe("access.jwt.token");
    expect(result.refreshToken).toHaveLength(96);
    expect(result.user.email).toBe("a@test.com");
  });

  it("register falla si email existe", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    await expect(
      service.register({
        email: "a@test.com",
        password: "secreto12",
        fullName: "Ana",
        role: "STUDENT",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("login falla con credenciales inválidas", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: "a@test.com", password: "x" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
