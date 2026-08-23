import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CreateCycleSchema } from "@sca/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CyclesService } from "./cycles.service";

@Controller("cycles")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyclesController {
  constructor(private readonly cycles: CyclesService) {}

  @Get()
  @Roles("ADMIN", "TEACHER")
  list(@Query("schoolId") schoolId?: string) {
    return this.cycles.list(schoolId);
  }

  @Post()
  @Roles("ADMIN")
  create(@Body() body: unknown) {
    const input = CreateCycleSchema.parse(body);
    return this.cycles.create(input);
  }

  @Patch(":id")
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: unknown) {
    const input = CreateCycleSchema.partial().parse(body);
    return this.cycles.update(id, input);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.cycles.remove(id);
  }
}
