import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateSchoolInput } from "@sca/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.school.findMany({ orderBy: { name: "asc" } });
  }

  create(input: CreateSchoolInput) {
    return this.prisma.school.create({ data: input });
  }

  async getById(id: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException("Escuela no encontrada");
    return school;
  }

  update(id: string, input: Partial<CreateSchoolInput>) {
    return this.prisma.school.update({ where: { id }, data: input });
  }
}
