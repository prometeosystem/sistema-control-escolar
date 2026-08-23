import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CreatePostSchema, UpdatePostSchema } from "@sca/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard, JwtPayload } from "../../common/guards/jwt-auth.guard";
import { PostsService } from "./posts.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get("classes/:classId/posts")
  list(
    @CurrentUser() user: JwtPayload,
    @Param("classId") classId: string,
  ) {
    return this.posts.listByClass(classId, user.sub, user.role);
  }

  @Post("classes/:classId/posts")
  create(
    @CurrentUser() user: JwtPayload,
    @Param("classId") classId: string,
    @Body() body: unknown,
  ) {
    const input = CreatePostSchema.parse(body);
    return this.posts.create(classId, user.sub, user.role, input);
  }

  @Get("posts/:id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.posts.getById(id, user.sub, user.role);
  }

  @Patch("posts/:id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = UpdatePostSchema.parse(body);
    return this.posts.update(id, user.sub, user.role, input);
  }

  @Delete("posts/:id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.posts.remove(id, user.sub, user.role);
  }
}
