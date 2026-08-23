import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { InviteUserSchema } from "@sca/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Post("users/invite")
  invite(@Body() body: unknown) {
    const input = InviteUserSchema.parse(body);
    return this.admin.invite(input);
  }
}
