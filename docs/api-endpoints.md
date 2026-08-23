# Mapa de endpoints API

Prefijo base: `/api/v1`  
Auth: `Authorization: Bearer <accessToken>` salvo donde se indique público.

Leyenda de roles: **A** Admin · **T** Teacher · **S** Student · **P** Parent · **Auth** cualquier autenticado · **\*** público

---

## Auth

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/auth/register` | * | Registro con email/password y rol permitido (STUDENT/TEACHER/PARENT; ADMIN solo seed) |
| POST | `/auth/login` | * | Login → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | * | Renueva access con refresh token |
| POST | `/auth/logout` | Auth | Revoca refresh token |
| GET | `/auth/me` | Auth | Perfil del usuario actual |

### Bodies (resumen)

**Register:** `{ email, password, fullName, role }`  
**Login:** `{ email, password }`  
**Refresh:** `{ refreshToken }`

---

## Escuela y ciclos

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/schools` | A | Listar escuelas |
| POST | `/schools` | A | Crear escuela |
| GET | `/schools/:id` | A | Detalle |
| PATCH | `/schools/:id` | A | Actualizar |
| GET | `/cycles` | A,T | Listar ciclos (filtro schoolId) |
| POST | `/cycles` | A | Crear ciclo |
| PATCH | `/cycles/:id` | A | Actualizar / activar |
| DELETE | `/cycles/:id` | A | Soft/hard delete según política |

---

## Usuarios

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/users` | A | Listar (filtros role, q) |
| GET | `/users/:id` | A | Detalle |
| PATCH | `/users/:id` | A | Actualizar datos |
| PATCH | `/users/:id/role` | A | Cambiar rol global |
| PATCH | `/users/me` | Auth | Actualizar perfil propio |
| PATCH | `/users/me/notification-preferences` | Auth | `{ emailNotify, inAppNotify }` |

---

## Clases

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/classes` | Auth | Clases del usuario (membership) |
| POST | `/classes` | T,A | Crear clase (creador queda como teacher) |
| GET | `/classes/:id` | Member | Detalle |
| PATCH | `/classes/:id` | Teacher-in-class,A | Actualizar |
| DELETE | `/classes/:id` | Teacher-in-class,A | Archivar/eliminar |
| POST | `/classes/join` | S | `{ joinCode }` unirse como student |
| GET | `/classes/:id/members` | Member | Listar miembros |
| POST | `/classes/:id/teachers` | Teacher-in-class,A | `{ userId }` agregar profesor |
| DELETE | `/classes/:id/members/:userId` | Teacher-in-class,A | Remover miembro |

**Create class:** `{ name, section?, subject?, cycleId }`

---

## Muro (posts)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/classes/:id/posts` | Member | Feed de la clase |
| POST | `/classes/:id/posts` | Teacher-in-class | Crear publicación |
| GET | `/posts/:id` | Member | Detalle |
| PATCH | `/posts/:id` | Author teacher / A | Editar |
| DELETE | `/posts/:id` | Author teacher / A | Eliminar |

**Create post:** `{ title, body, attachmentIds? }`

---

## Tareas y equipos

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/classes/:id/assignments` | Member | Listar tareas |
| POST | `/classes/:id/assignments` | Teacher-in-class | Crear tarea |
| GET | `/assignments/:id` | Member | Detalle |
| PATCH | `/assignments/:id` | Teacher-in-class | Actualizar |
| DELETE | `/assignments/:id` | Teacher-in-class | Eliminar |
| POST | `/assignments/:id/publish` | Teacher-in-class | Publicar (dispara notificaciones) |
| GET | `/assignments/:id/teams` | Member | Listar equipos |
| POST | `/assignments/:id/teams` | Teacher-in-class | Crear equipos `{ teams: [{ name, memberIds }] }` |
| POST | `/teams/:id/members` | Teacher-in-class | Agregar miembro |
| DELETE | `/teams/:id/members/:userId` | Teacher-in-class | Quitar miembro |

**Create assignment:** `{ title, description, mode: individual\|team, dueAt, maxScore, attachmentIds? }`

---

## Entregas y calificación

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/assignments/:id/submissions` | Teacher-in-class | Todas las entregas |
| GET | `/assignments/:id/submissions/me` | S | Entrega propia / de su equipo |
| POST | `/assignments/:id/submit` | S | Entregar `{ content?, attachmentIds? }` |
| PATCH | `/submissions/:id` | S (owner/team) | Actualizar borrador / reentregar si permitido |
| POST | `/submissions/:id/grade` | Teacher-in-class | `{ score, feedback? }` |

---

## Exámenes

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/classes/:id/exams` | Member | Listar |
| POST | `/classes/:id/exams` | Teacher-in-class | Crear examen + questions |
| GET | `/exams/:id` | Member | Detalle (sin correctAnswers para S en intento activo) |
| PATCH | `/exams/:id` | Teacher-in-class | Actualizar |
| DELETE | `/exams/:id` | Teacher-in-class | Eliminar |
| POST | `/exams/:id/publish` | Teacher-in-class | Publicar |
| PUT | `/exams/:id/questions` | Teacher-in-class | Reemplazar/actualizar preguntas |
| POST | `/exams/:id/start` | S | Iniciar intento |
| POST | `/attempts/:id/answer` | S | `{ questionId, answer }` |
| POST | `/attempts/:id/submit` | S | Cerrar intento y calificar |
| GET | `/exams/:id/results` | Teacher-in-class | Resultados de la clase |
| GET | `/exams/:id/results/me` | S | Resultado propio |

**Question:** `{ order, type, prompt, options?, correctAnswer?, points }`

---

## Padres

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/parents/link-request` | P | `{ studentEmail }` o código |
| GET | `/parents/link-requests` | P,S,A | Pendientes relevantes |
| POST | `/parents/link-requests/:id/approve` | S (hijo), A | Aprobar |
| POST | `/parents/link-requests/:id/reject` | S, A | Rechazar |
| GET | `/parents/children` | P | Hijos aprobados |
| GET | `/parents/children/:id/grades` | P | Calificaciones del hijo |
| GET | `/parents/children/:id/submissions` | P | Entregas del hijo |

---

## Archivos (Firebase Storage)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/files/presign` | Auth | `{ originalName, mimeType, size, purpose }` → `{ fileId?, storagePath, uploadUrl, expiresAt }` |
| POST | `/files/confirm` | Auth | `{ storagePath, originalName, mimeType, size }` → `Attachment` |
| GET | `/files/:id` | Auth + ACL | Metadatos + `downloadUrl` firmada |
| DELETE | `/files/:id` | Owner / Teacher / A | Borra en Firebase + DB |

**ACL lectura:** uploader, teachers de la clase asociada, companions de equipo, padres con link approved, admin.

---

## Notificaciones

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/notifications` | Auth | Lista paginada (`unreadOnly?`) |
| PATCH | `/notifications/:id/read` | Auth | Marcar leída |
| POST | `/notifications/read-all` | Auth | Marcar todas leídas |

---

## Admin

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/admin/stats` | A | Conteos usuarios/clases/entregas |
| POST | `/admin/users/invite` | A | Alta asistida (opcional fase 6) |

---

## Códigos HTTP

| Código | Uso |
|--------|-----|
| 200 / 201 | OK / creado |
| 400 | Validación |
| 401 | No autenticado |
| 403 | Sin permiso |
| 404 | No encontrado |
| 409 | Conflicto (email, join, intento duplicado) |
| 422 | Regla de negocio (entrega cerrada, examen fuera de ventana) |
| 500 | Error interno |

## Formato de error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

## Paginación

Query estándar: `page` (default 1), `pageSize` (default 20, max 100).  
Respuesta: `{ data: [], meta: { page, pageSize, total, totalPages } }`.
