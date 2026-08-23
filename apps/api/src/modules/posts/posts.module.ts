import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
