import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { CyclesController } from "./cycles.controller";
import { CyclesService } from "./cycles.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
