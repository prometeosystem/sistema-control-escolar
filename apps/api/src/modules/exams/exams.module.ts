import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AutoGradeService } from "./auto-grade.service";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [ExamsController],
  providers: [ExamsService, AutoGradeService],
  exports: [ExamsService, AutoGradeService],
})
export class ExamsModule {}
