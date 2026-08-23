import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
