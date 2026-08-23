import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { TestSmtpSchema, UpdateSmtpSettingsSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SmtpSettingsService } from "./smtp-settings.service";

@Controller("admin/smtp")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class SmtpSettingsController {
  constructor(private readonly smtp: SmtpSettingsService) {}

  @Get()
  get() {
    return this.smtp.getPublic();
  }

  @Put()
  upsert(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = UpdateSmtpSettingsSchema.parse(body);
    return this.smtp.upsert(user.sub, input).then(() => this.smtp.getPublic());
  }

  @Post("test")
  test(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = TestSmtpSchema.parse(body);
    return this.smtp.test(user.role, input.to);
  }
}
