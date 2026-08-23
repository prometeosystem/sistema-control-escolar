import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query("unreadOnly") unreadOnly?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.notifications.list(
      user.sub,
      unreadOnly === "true",
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.notifications.markRead(id, user.sub);
  }

  @Post("read-all")
  markAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }
}
