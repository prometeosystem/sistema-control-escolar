import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  NotificationPreferencesSchema,
  UpdateProfileSchema,
  UpdateUserRoleSchema,
} from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles("ADMIN")
  list(
    @Query("role") role?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.users.list({
      role,
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Patch("me")
  updateMe(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = UpdateProfileSchema.parse(body);
    return this.users.updateProfile(user.sub, input);
  }

  @Patch("me/notification-preferences")
  updatePrefs(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = NotificationPreferencesSchema.parse(body);
    return this.users.updateNotificationPreferences(user.sub, input);
  }

  @Patch(":id/role")
  @Roles("ADMIN")
  updateRole(@Param("id") id: string, @Body() body: unknown) {
    const input = UpdateUserRoleSchema.parse(body);
    return this.users.updateRole(id, input.role);
  }

  @Get(":id")
  @Roles("ADMIN")
  get(@Param("id") id: string) {
    return this.users.getById(id);
  }

  @Patch(":id")
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() body: unknown) {
    const input = UpdateProfileSchema.parse(body);
    return this.users.updateProfile(id, input);
  }
}
