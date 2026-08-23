import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { GradesService } from "./grades.service";

@Controller("grades")
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Get("me")
  mine(@CurrentUser() user: JwtPayload) {
    return this.grades.listForStudent(user.sub);
  }

  @Get("student/:studentId")
  forStudent(
    @CurrentUser() user: JwtPayload,
    @Param("studentId") studentId: string,
  ) {
    return this.grades.listForStudentAsTeacher(studentId, user.sub, user.role);
  }
}
