import { ConflictException, ForbiddenException } from "@nestjs/common";
import { ParentsService } from "./parents.service";

describe("ParentsService", () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    parentLink: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const notifications = { notify: jest.fn(), notifyMany: jest.fn() };
  let service: ParentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ParentsService(prisma as never, notifications as never);
  });

  it("bloquea solicitud si el rol no es padre", async () => {
    await expect(
      service.requestLink("p1", "STUDENT", {
        studentEmail: "a@test.com",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rechaza vínculo duplicado aprobado", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "s1",
      role: "STUDENT",
      email: "a@test.com",
    });
    prisma.parentLink.findUnique.mockResolvedValue({
      id: "l1",
      status: "approved",
    });
    await expect(
      service.requestLink("p1", "PARENT", { studentEmail: "a@test.com" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
