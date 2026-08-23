import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CreateAssignmentSchema,
  CreateTeamsSchema,
  UpdateAssignmentSchema,
} from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { AssignmentsService } from "./assignments.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get("classes/:classId/assignments")
  list(@CurrentUser() user: JwtPayload, @Param("classId") classId: string) {
    return this.assignments.listByClass(classId, user.sub, user.role);
  }

  @Post("classes/:classId/assignments")
  create(
    @CurrentUser() user: JwtPayload,
    @Param("classId") classId: string,
    @Body() body: unknown,
  ) {
    const input = CreateAssignmentSchema.parse(body);
    return this.assignments.create(classId, user.sub, user.role, input);
  }

  @Get("assignments/:id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.assignments.getById(id, user.sub, user.role);
  }

  @Patch("assignments/:id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = UpdateAssignmentSchema.parse(body);
    return this.assignments.update(id, user.sub, user.role, input);
  }

  @Post("assignments/:id/publish")
  publish(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.assignments.publish(id, user.sub, user.role);
  }

  @Delete("assignments/:id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.assignments.remove(id, user.sub, user.role);
  }

  @Get("assignments/:id/teams")
  listTeams(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.assignments.listTeams(id, user.sub, user.role);
  }

  @Post("assignments/:id/teams")
  createTeams(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = CreateTeamsSchema.parse(body);
    return this.assignments.createTeams(id, user.sub, user.role, input);
  }
}
