import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { LoginSchema, RegisterSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: unknown) {
    const input = RegisterSchema.parse(body);
    return this.auth.register(input);
  }

  @Post("login")
  login(@Body() body: unknown) {
    const input = LoginSchema.parse(body);
    return this.auth.login(input);
  }

  @Post("refresh")
  refresh(@Body() body: { refreshToken?: string }) {
    if (!body?.refreshToken) {
      throw new UnauthorizedException("refreshToken requerido");
    }
    return this.auth.refresh(body.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(@Body() body: { refreshToken?: string }) {
    if (!body?.refreshToken) {
      return { ok: true };
    }
    return this.auth.logout(body.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }
}
