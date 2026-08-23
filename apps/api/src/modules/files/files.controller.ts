import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ConfirmFileSchema, PresignFileSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { FilesService } from "./files.service";

@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post("presign")
  presign(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = PresignFileSchema.parse(body);
    return this.files.presign(user.sub, input);
  }

  @Post("confirm")
  confirm(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = ConfirmFileSchema.parse(body);
    return this.files.confirm(user.sub, input);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.files.getForUser(id, user.sub, user.role);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.files.remove(id, user.sub, user.role);
  }
}
