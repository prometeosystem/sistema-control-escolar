import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { GradesController } from "./grades.controller";
import { GradesService } from "./grades.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
