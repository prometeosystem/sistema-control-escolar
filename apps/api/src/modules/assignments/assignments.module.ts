import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
