import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
