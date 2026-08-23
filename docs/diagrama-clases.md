# Diagrama de clases

Modelo de dominio y servicios de aplicación. Los servicios viven en NestJS (`apps/api`); las entidades se materializan con Prisma.

## Dominio

```mermaid
classDiagram
  class Role {
    <<enumeration>>
    ADMIN
    TEACHER
    STUDENT
    PARENT
  }

  class User {
    +UUID id
    +string email
    +string passwordHash
    +Role role
    +string fullName
    +boolean emailNotify
    +boolean inAppNotify
  }

  class School {
    +UUID id
    +string name
  }

  class AcademicCycle {
    +UUID id
    +string name
    +Date startsAt
    +Date endsAt
    +boolean isActive
  }

  class ClassRoom {
    +UUID id
    +string name
    +string section
    +string joinCode
    +UUID cycleId
  }

  class ClassMembership {
    +UUID id
    +RoleInClass roleInClass
  }

  class Post {
    +UUID id
    +string title
    +string body
    +DateTime createdAt
  }

  class Assignment {
    +UUID id
    +string title
    +AssignmentMode mode
    +DateTime dueAt
    +number maxScore
  }

  class Team {
    +UUID id
    +string name
  }

  class TeamMember {
    +UUID id
  }

  class Submission {
    +UUID id
    +SubmissionStatus status
    +DateTime submittedAt
    +string content
  }

  class Exam {
    +UUID id
    +string title
    +number timeLimitMin
    +number maxScore
  }

  class ExamQuestion {
    +UUID id
    +QuestionType type
    +string prompt
    +number points
  }

  class ExamAttempt {
    +UUID id
    +DateTime startedAt
    +DateTime submittedAt
    +number score
  }

  class ExamAnswer {
    +UUID id
    +json answer
    +boolean isCorrect
  }

  class Grade {
    +UUID id
    +number score
    +number maxScore
    +string feedback
  }

  class ParentLink {
    +UUID id
    +LinkStatus status
  }

  class Attachment {
    +UUID id
    +string storagePath
    +string bucket
    +string mimeType
    +number size
    +string originalName
  }

  class Notification {
    +UUID id
    +string type
    +string title
    +string body
    +DateTime readAt
  }

  class EmailLog {
    +UUID id
    +string to
    +string template
    +EmailStatus status
  }

  School "1" --> "*" AcademicCycle
  School "1" --> "*" User
  AcademicCycle "1" --> "*" ClassRoom
  User "1" --> "*" ClassMembership
  ClassRoom "1" --> "*" ClassMembership
  ClassRoom "1" --> "*" Post
  ClassRoom "1" --> "*" Assignment
  ClassRoom "1" --> "*" Exam
  Assignment "1" --> "*" Team
  Team "1" --> "*" TeamMember
  User "1" --> "*" TeamMember
  Assignment "1" --> "*" Submission
  User "1" --> "*" Submission
  Team "0..1" --> "*" Submission
  Submission "0..1" --> "1" Grade
  Exam "1" --> "*" ExamQuestion
  Exam "1" --> "*" ExamAttempt
  ExamAttempt "1" --> "*" ExamAnswer
  ExamAttempt "0..1" --> "1" Grade
  User "1" --> "*" ParentLink : parent
  User "1" --> "*" ParentLink : child
  User "1" --> "*" Notification
  User "1" --> "*" Attachment : uploads
  Post "0..1" --> "*" Attachment
  Assignment "0..1" --> "*" Attachment
  Submission "0..1" --> "*" Attachment
```

## Servicios de aplicación (NestJS)

```mermaid
classDiagram
  class AuthService {
    +register(dto)
    +login(dto)
    +refresh(token)
    +logout(token)
    +me(userId)
  }

  class ClassesService {
    +create(dto, teacherId)
    +join(joinCode, studentId)
    +addTeacher(classId, userId)
    +listMembers(classId)
  }

  class PostsService {
    +listByClass(classId)
    +create(classId, dto)
    +update(postId, dto)
    +remove(postId)
  }

  class AssignmentsService {
    +create(classId, dto)
    +createTeams(assignmentId, teams)
    +update(id, dto)
  }

  class SubmissionsService {
    +submit(assignmentId, dto)
    +list(assignmentId)
    +grade(submissionId, dto)
  }

  class ExamsService {
    +create(classId, dto)
    +startAttempt(examId, studentId)
    +answer(attemptId, dto)
    +submitAttempt(attemptId)
    +results(examId)
  }

  class GradesService {
    +upsertForSubmission(dto)
    +upsertForAttempt(dto)
    +listForStudent(studentId)
  }

  class ParentsService {
    +requestLink(parentId, studentEmail)
    +approve(linkId, actorId)
    +children(parentId)
    +childGrades(parentId, studentId)
  }

  class FilesService {
    +presign(userId, dto)
    +confirm(userId, dto)
    +getSignedUrl(fileId, userId)
    +remove(fileId, userId)
  }

  class StorageService {
    +createUploadUrl(path)
    +getSignedDownloadUrl(path)
    +delete(path)
  }

  class NotificationsService {
    +notify(userId, payload)
    +list(userId)
    +markRead(id, userId)
    +markAllRead(userId)
  }

  class MailService {
    +send(template, to, payload)
  }

  FilesService --> StorageService
  NotificationsService --> MailService
  SubmissionsService --> GradesService
  SubmissionsService --> NotificationsService
  ExamsService --> GradesService
  ExamsService --> NotificationsService
  AssignmentsService --> NotificationsService
  PostsService --> NotificationsService
  ParentsService --> NotificationsService
```

## Enumeraciones

| Enum | Valores |
|------|---------|
| `Role` | ADMIN, TEACHER, STUDENT, PARENT |
| `RoleInClass` | teacher, student |
| `AssignmentMode` | individual, team |
| `SubmissionStatus` | draft, submitted, graded, returned |
| `QuestionType` | multiple_choice, true_false, short |
| `LinkStatus` | pending, approved, rejected |
| `EmailStatus` | sent, failed |

## Capas y guards

```mermaid
flowchart TB
  Controller --> JwtAuthGuard
  JwtAuthGuard --> RolesGuard
  RolesGuard --> ClassMemberGuard
  ClassMemberGuard --> Service
  Service --> PrismaService
  Service --> StorageService
  Service --> MailService
```
