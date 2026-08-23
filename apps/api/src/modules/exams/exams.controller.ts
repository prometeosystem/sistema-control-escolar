import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  AnswerExamSchema,
  CreateExamSchema,
  ReplaceQuestionsSchema,
  UpdateExamSchema,
} from "@sca/shared";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { ExamsService } from "./exams.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get("classes/:classId/exams")
  list(@CurrentUser() user: JwtPayload, @Param("classId") classId: string) {
    return this.exams.listByClass(classId, user.sub, user.role);
  }

  @Post("classes/:classId/exams")
  create(
    @CurrentUser() user: JwtPayload,
    @Param("classId") classId: string,
    @Body() body: unknown,
  ) {
    const input = CreateExamSchema.parse(body);
    return this.exams.create(classId, user.sub, user.role, input);
  }

  @Get("exams/:id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.getById(id, user.sub, user.role);
  }

  @Patch("exams/:id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = UpdateExamSchema.parse(body);
    return this.exams.update(id, user.sub, user.role, input);
  }

  @Put("exams/:id/questions")
  replaceQuestions(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = ReplaceQuestionsSchema.parse(body);
    return this.exams.replaceQuestions(id, user.sub, user.role, input);
  }

  @Put("exams/:id/audience")
  setAudience(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = z
      .object({ studentIds: z.array(z.string().uuid()) })
      .parse(body);
    return this.exams.setAudience(id, user.sub, user.role, input.studentIds);
  }

  @Post("exams/:id/publish")
  publish(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.publish(id, user.sub, user.role);
  }

  @Post("exams/:id/start")
  start(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.startAttempt(id, user.sub, user.role);
  }

  @Post("attempts/:id/answer")
  answer(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = AnswerExamSchema.parse(body);
    return this.exams.answer(id, user.sub, input);
  }

  @Post("attempts/:id/submit")
  submit(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.submitAttempt(id, user.sub);
  }

  @Get("exams/:id/results")
  results(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.results(id, user.sub, user.role);
  }

  @Get("exams/:id/results/me")
  myResults(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.exams.myResults(id, user.sub);
  }
}
