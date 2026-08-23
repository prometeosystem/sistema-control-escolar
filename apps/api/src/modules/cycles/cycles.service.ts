import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCycleInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  list(schoolId?: string) {
    return this.prisma.academicCycle.findMany({
      where: schoolId ? { schoolId } : undefined,
      orderBy: { startsAt: "desc" },
    });
  }

  async create(input: CreateCycleInput) {
    if (input.isActive) {
      await this.prisma.academicCycle.updateMany({
        where: { schoolId: input.schoolId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicCycle.create({
      data: {
        schoolId: input.schoolId,
        name: input.name,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        isActive: input.isActive ?? false,
      },
    });
  }

  async update(id: string, input: Partial<CreateCycleInput>) {
    const existing = await this.prisma.academicCycle.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Ciclo no encontrado");

    if (input.isActive) {
      await this.prisma.academicCycle.updateMany({
        where: { schoolId: existing.schoolId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicCycle.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
        ...(typeof input.isActive === "boolean"
          ? { isActive: input.isActive }
          : {}),
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.academicCycle.delete({ where: { id } });
    return { ok: true };
  }
}
