import { AdminService } from "./admin.service";

describe("AdminService", () => {
  const prisma = {
    user: { count: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    class: { count: jest.fn() },
    assignment: { count: jest.fn() },
    submission: { count: jest.fn() },
    exam: { count: jest.fn() },
    parentLink: { count: jest.fn() },
    school: { findUnique: jest.fn() },
  };
  const mail = { send: jest.fn() };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.count.mockResolvedValue(10);
    prisma.class.count.mockResolvedValue(2);
    prisma.assignment.count.mockResolvedValue(3);
    prisma.submission.count.mockResolvedValue(4);
    prisma.exam.count.mockResolvedValue(1);
    prisma.parentLink.count.mockResolvedValue(0);
    service = new AdminService(prisma as never, mail as never);
  });

  it("devuelve conteos agregados", async () => {
    const stats = await service.stats();
    expect(stats.users).toBe(10);
    expect(stats.classes).toBe(2);
    expect(stats.submissions).toBe(4);
  });
});
