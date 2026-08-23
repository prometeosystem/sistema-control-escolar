import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { GradeSubmissionSchema, SubmitAssignmentSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { SubmissionsService } from "./submissions.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get("assignments/:id/submissions")
  list(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.submissions.listForAssignment(id, user.sub, user.role);
  }

  @Get("assignments/:id/submissions/me")
  mine(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.submissions.mySubmission(id, user.sub, user.role);
  }

  @Post("assignments/:id/submit")
  submit(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = SubmitAssignmentSchema.parse(body);
    return this.submissions.submit(id, user.sub, user.role, input);
  }

  @Post("submissions/:id/grade")
  grade(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = GradeSubmissionSchema.parse(body);
    return this.submissions.grade(id, user.sub, user.role, input);
  }
}
