import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
