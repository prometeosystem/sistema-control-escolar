import { ForbiddenException } from "@nestjs/common";
import { RoleInClass } from "@prisma/client";
import { ClassesService } from "./classes.service";

describe("ClassesService", () => {
  const prisma = {
    class: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    academicCycle: {
      findUnique: jest.fn(),
    },
    classMembership: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: ClassesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClassesService(prisma as never);
  });

  it("impide que un alumno cree clase", async () => {
    await expect(
      service.create("u1", "STUDENT", {
        name: "Historia",
        cycleId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("une alumno con código", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1",
      joinCode: "ABC123",
      archivedAt: null,
    });
    prisma.classMembership.findUnique.mockResolvedValue(null);
    prisma.classMembership.create.mockResolvedValue({
      id: "m1",
      classId: "c1",
      userId: "u1",
      roleInClass: RoleInClass.student,
    });

    const result = await service.join("u1", "STUDENT", { joinCode: "abc123" });
    expect(result.membership.classId).toBe("c1");
  });
});
