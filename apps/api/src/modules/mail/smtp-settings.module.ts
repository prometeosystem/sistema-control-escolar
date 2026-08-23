import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "./mail.module";
import { SmtpSettingsController } from "./smtp-settings.controller";
import { SmtpSettingsService } from "./smtp-settings.service";

@Module({
  imports: [MailModule, JwtModule.register({})],
  controllers: [SmtpSettingsController],
  providers: [SmtpSettingsService],
  exports: [SmtpSettingsService],
})
export class SmtpSettingsModule {}
