import { ForbiddenException } from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";

describe("AssignmentsService", () => {
  const prisma = {
    classMembership: { findUnique: jest.fn() },
    assignment: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: AssignmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    const notifications = {
      notify: jest.fn(),
      notifyMany: jest.fn().mockResolvedValue([]),
    };
    service = new AssignmentsService(prisma as never, notifications as never);
  });

  it("bloquea crear tarea si no es profesor", async () => {
    prisma.classMembership.findUnique.mockResolvedValue({
      roleInClass: "student",
    });
    await expect(
      service.create("c1", "u1", "STUDENT", {
        title: "Tarea 1",
        description: "Leer cap 1",
        mode: "individual",
        dueAt: new Date().toISOString(),
        maxScore: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
