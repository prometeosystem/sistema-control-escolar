# Diagrama entidad-relación (PostgreSQL)

Fuente de verdad futura: `apps/api/prisma/schema.prisma`. Este documento define el modelo lógico previo al código de dominio.

## Diagrama

```mermaid
erDiagram
  School ||--o{ AcademicCycle : has
  School ||--o{ User : has
  AcademicCycle ||--o{ Class : contains
  User ||--o{ ClassMembership : joins
  Class ||--o{ ClassMembership : has
  Class ||--o{ Post : publishes
  Class ||--o{ Assignment : has
  Class ||--o{ Exam : has
  Class ||--o{ Team : has
  User ||--o{ Post : authors
  Post ||--o{ Attachment : has
  Assignment ||--o{ Submission : receives
  Assignment ||--o{ Team : optional
  Assignment ||--o{ Attachment : materials
  Team ||--o{ TeamMember : has
  User ||--o{ TeamMember : member
  Submission ||--o{ Attachment : files
  User ||--o{ Submission : submits
  User ||--o{ Attachment : uploadedBy
  Exam ||--o{ ExamQuestion : has
  Exam ||--o{ ExamAttempt : has
  ExamAttempt ||--o{ ExamAnswer : has
  User ||--o{ ExamAttempt : takes
  User ||--o{ ParentLink : asParent
  User ||--o{ ParentLink : asChild
  User ||--o{ Grade : receives
  Assignment ||--o{ Grade : graded
  ExamAttempt ||--o{ Grade : graded
  User ||--o{ Notification : receives
  User ||--o{ EmailLog : receives
  User ||--o{ RefreshToken : has
```

## Tablas y campos

### School

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | string | |
| createdAt / updatedAt | datetime | |

### AcademicCycle

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| schoolId | UUID FK → School | |
| name | string | ej. "2025-2026" |
| startsAt / endsAt | date | |
| isActive | boolean | |

### User

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| schoolId | UUID FK → School | nullable en bootstrap |
| email | string unique | |
| passwordHash | string | bcrypt/argon2 |
| role | enum | ADMIN, TEACHER, STUDENT, PARENT |
| fullName | string | |
| emailNotify | boolean | preferencia SMTP |
| inAppNotify | boolean | preferencia in-app |
| createdAt / updatedAt | datetime | |

### RefreshToken

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| userId | UUID FK → User | |
| tokenHash | string | |
| expiresAt | datetime | |
| revokedAt | datetime nullable | |

### Class

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| schoolId | UUID FK → School | |
| cycleId | UUID FK → AcademicCycle | |
| name | string | |
| section | string nullable | ej. "2A" |
| subject | string nullable | |
| joinCode | string unique | código de ingreso |
| archivedAt | datetime nullable | |

### ClassMembership

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| classId | UUID FK → Class | |
| userId | UUID FK → User | |
| roleInClass | enum | teacher, student |
| unique | (classId, userId) | |

### Post

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| classId | UUID FK → Class | |
| authorId | UUID FK → User | |
| title | string | |
| body | text | |
| createdAt / updatedAt | datetime | |

### Attachment

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| uploadedById | UUID FK → User | |
| storagePath | string | path en Firebase |
| bucket | string | |
| mimeType | string | |
| size | int | bytes |
| originalName | string | |
| postId | UUID FK nullable | |
| assignmentId | UUID FK nullable | materiales |
| submissionId | UUID FK nullable | entregas |
| createdAt | datetime | |

### Assignment

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| classId | UUID FK → Class | |
| createdById | UUID FK → User | |
| title | string | |
| description | text | |
| mode | enum | individual, team |
| dueAt | datetime | |
| maxScore | decimal | |
| publishedAt | datetime nullable | |
| createdAt / updatedAt | datetime | |

### Team

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| assignmentId | UUID FK → Assignment | |
| name | string | |
| unique | (assignmentId, name) | |

### TeamMember

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| teamId | UUID FK → Team | |
| userId | UUID FK → User | |
| unique | (teamId, userId) | |

### Submission

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| assignmentId | UUID FK → Assignment | |
| studentId | UUID FK → User nullable | individual |
| teamId | UUID FK → Team nullable | equipo |
| status | enum | draft, submitted, graded, returned |
| content | text nullable | comentario/texto |
| submittedAt | datetime nullable | |
| createdAt / updatedAt | datetime | |
| check | individual XOR team | |

### Exam

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| classId | UUID FK → Class | |
| createdById | UUID FK → User | |
| title | string | |
| description | text nullable | |
| timeLimitMin | int nullable | |
| maxScore | decimal | |
| opensAt / closesAt | datetime nullable | |
| publishedAt | datetime nullable | |

### ExamQuestion

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| examId | UUID FK → Exam | |
| order | int | |
| type | enum | multiple_choice, true_false, short |
| prompt | text | |
| options | jsonb nullable | para multiple_choice |
| correctAnswer | jsonb nullable | para auto-calificar |
| points | decimal | |

### ExamAttempt

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| examId | UUID FK → Exam | |
| studentId | UUID FK → User | |
| startedAt | datetime | |
| submittedAt | datetime nullable | |
| score | decimal nullable | |
| unique | (examId, studentId) en v1 un intento | |

### ExamAnswer

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| attemptId | UUID FK → ExamAttempt | |
| questionId | UUID FK → ExamQuestion | |
| answer | jsonb | |
| isCorrect | boolean nullable | |
| pointsAwarded | decimal nullable | |
| unique | (attemptId, questionId) | |

### Grade

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| studentId | UUID FK → User | |
| assignmentId | UUID FK nullable | |
| examAttemptId | UUID FK nullable | |
| score | decimal | |
| maxScore | decimal | |
| feedback | text nullable | |
| gradedById | UUID FK → User | |
| gradedAt | datetime | |
| check | assignment XOR examAttempt | |

### ParentLink

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| parentId | UUID FK → User | |
| studentId | UUID FK → User | |
| status | enum | pending, approved, rejected |
| unique | (parentId, studentId) | |

### Notification

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| userId | UUID FK → User | |
| type | string | ej. assignment.published |
| title | string | |
| body | text | |
| metadata | jsonb nullable | |
| readAt | datetime nullable | |
| createdAt | datetime | |

### EmailLog

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| userId | UUID FK → User nullable | |
| to | string | |
| subject | string | |
| template | string | |
| status | enum | sent, failed |
| providerMessageId | string nullable | |
| error | text nullable | |
| createdAt | datetime | |

## Índices recomendados

- `User.email` unique
- `Class.joinCode` unique
- `ClassMembership(classId, userId)` unique
- `Submission(assignmentId, studentId)` / `(assignmentId, teamId)`
- `Notification(userId, readAt, createdAt)`
- `Grade(studentId)`, `Grade(assignmentId)`, `Grade(examAttemptId)`
