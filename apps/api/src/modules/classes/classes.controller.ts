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
  AddTeacherSchema,
  CreateClassSchema,
  JoinClassSchema,
  UpdateClassSchema,
} from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { ClassesService } from "./classes.service";

@Controller("classes")
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.classes.listForUser(user.sub, user.role);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = CreateClassSchema.parse(body);
    return this.classes.create(user.sub, user.role, input);
  }

  @Post("join")
  join(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = JoinClassSchema.parse(body);
    return this.classes.join(user.sub, user.role, input);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.classes.getById(id, user.sub, user.role);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = UpdateClassSchema.parse(body);
    return this.classes.update(id, user.sub, user.role, input);
  }

  @Delete(":id")
  archive(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.classes.archive(id, user.sub, user.role);
  }

  @Get(":id/members")
  members(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.classes.listMembers(id, user.sub, user.role);
  }

  @Post(":id/teachers")
  addTeacher(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = AddTeacherSchema.parse(body);
    return this.classes.addTeacher(id, user.sub, user.role, input);
  }

  @Delete(":id/members/:userId")
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.classes.removeMember(id, userId, user.sub, user.role);
  }
}
