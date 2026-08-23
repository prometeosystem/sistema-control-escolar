import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { FilesModule } from "./modules/files/files.module";
import { GradesModule } from "./modules/grades/grades.module";
import { PostsModule } from "./modules/posts/posts.module";
import { SchoolsModule } from "./modules/schools/schools.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
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
    AssignmentsModule,
    SubmissionsModule,
    GradesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
