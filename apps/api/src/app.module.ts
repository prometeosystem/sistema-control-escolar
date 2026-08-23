import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { FilesModule } from "./modules/files/files.module";
import { PostsModule } from "./modules/posts/posts.module";
import { SchoolsModule } from "./modules/schools/schools.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    CyclesModule,
    ClassesModule,
    PostsModule,
    FilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
