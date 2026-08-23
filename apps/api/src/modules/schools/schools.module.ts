import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SchoolsController } from "./schools.controller";
import { SchoolsService } from "./schools.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
