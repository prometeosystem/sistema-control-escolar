import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { StorageService } from "./storage.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [FilesController],
  providers: [FilesService, StorageService],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
