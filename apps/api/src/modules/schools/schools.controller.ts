import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CreateSchoolSchema } from "@sca/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SchoolsService } from "./schools.service";

@Controller("schools")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Get()
  list() {
    return this.schools.list();
  }

  @Post()
  create(@Body() body: unknown) {
    const input = CreateSchoolSchema.parse(body);
    return this.schools.create(input);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.schools.getById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const input = CreateSchoolSchema.partial().parse(body);
    return this.schools.update(id, input);
  }
}
