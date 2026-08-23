import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { FilesModule } from "./modules/files/files.module";
import { GradesModule } from "./modules/grades/grades.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { PostsModule } from "./modules/posts/posts.module";
import { SchoolsModule } from "./modules/schools/schools.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { UsersModule } from "./modules/users/users.module";
import { MailModule } from "./modules/mail/mail.module";
import { SmtpSettingsModule } from "./modules/mail/smtp-settings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ParentsModule } from "./modules/parents/parents.module";
import { AdminModule } from "./modules/admin/admin.module";
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
    ExamsModule,
    MailModule,
    SmtpSettingsModule,
    NotificationsModule,
    ParentsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
