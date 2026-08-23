import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ParentLinkRequestSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ParentsService } from "./parents.service";

@Controller("parents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parents: ParentsService) {}

  @Post("link-request")
  @Roles("PARENT", "ADMIN")
  requestLink(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = ParentLinkRequestSchema.parse(body);
    return this.parents.requestLink(user.sub, user.role, input);
  }

  @Get("link-requests")
  @Roles("PARENT", "STUDENT", "ADMIN")
  listRequests(@CurrentUser() user: JwtPayload) {
    return this.parents.listRequests(user.sub, user.role);
  }

  @Post("link-requests/:id/approve")
  @Roles("STUDENT", "ADMIN")
  approve(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.parents.approve(id, user.sub, user.role);
  }

  @Post("link-requests/:id/reject")
  @Roles("STUDENT", "ADMIN")
  reject(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.parents.reject(id, user.sub, user.role);
  }

  @Get("children")
  @Roles("PARENT", "ADMIN")
  children(@CurrentUser() user: JwtPayload) {
    return this.parents.listChildren(user.sub, user.role);
  }

  @Get("children/:id/grades")
  @Roles("PARENT", "ADMIN")
  grades(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.parents.childGrades(user.sub, id, user.role);
  }

  @Get("children/:id/submissions")
  @Roles("PARENT", "ADMIN")
  submissions(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.parents.childSubmissions(user.sub, id, user.role);
  }
}
