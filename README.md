# Sistema de control de actividades escolares (SCA)

Monorepo Classroom-like para secundaria: clases, muro, tareas individuales/equipo, exámenes, calificaciones, padres y admin. Frontend **Next.js**, backend **NestJS**, base **PostgreSQL**, archivos en **Firebase Storage**, notificaciones por **SMTP**.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/architecture.md](docs/architecture.md) | Visión, stack, RBAC, módulos, despliegue |
| [docs/diagrama-er.md](docs/diagrama-er.md) | Modelo entidad-relación PostgreSQL |
| [docs/diagrama-clases.md](docs/diagrama-clases.md) | Dominio y servicios |
| [docs/api-endpoints.md](docs/api-endpoints.md) | Mapa REST `/api/v1` |
| [docs/estructura-archivos.md](docs/estructura-archivos.md) | Árbol del monorepo |
| [docs/manual-desarrollo.md](docs/manual-desarrollo.md) | Setup y convenciones |
| [docs/gitflow.md](docs/gitflow.md) | Flujo Git completo |
| [docs/ux-heuristics.md](docs/ux-heuristics.md) | 10 heurísticas Nielsen (checklist PRs) |

## Stack

- **Monorepo:** pnpm + Turborepo
- **Web:** `apps/web` — Next.js (App Router) + React
- **API:** `apps/api` — NestJS + Prisma
- **Shared:** `packages/shared` — contratos Zod
- **DB:** PostgreSQL (Docker Compose)
- **Storage:** Firebase Storage
- **Mail:** SMTP (Nodemailer en fases posteriores)

## Inicio rápido

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm --filter @sca/api prisma:generate
pnpm dev
```

- Web: http://localhost:3000  
- API health: http://localhost:3001/api/v1/health  

Detalle: [docs/manual-desarrollo.md](docs/manual-desarrollo.md).

## GitFlow (obligatorio)

Trabajamos con **GitFlow**. Detalle en [docs/gitflow.md](docs/gitflow.md).

### Ramas

| Rama | Uso |
|------|-----|
| `main` | Producción. Solo merges desde `release/*` o `hotfix/*`. Tags `vX.Y.Z` |
| `develop` | Integración de features |
| `feature/<nombre>` | Funcionalidad nueva (desde `develop`) |
| `release/x.y.z` | Preparación de release (desde `develop`) |
| `hotfix/x.y.z` | Parche urgente (desde `main`) |

### Reglas

1. No commits directos a `main` ni `develop` (salvo bootstrap inicial).
2. Toda feature → **PR a `develop`** (review + CI).
3. Commits convencionales: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
4. Release: PR `release/*` → `main`, tag, merge back a `develop`.
5. Hotfix: desde `main`, PR a `main` + backport a `develop`.
6. En GitHub: proteger `main` y `develop` (require PR, checks, sin force-push).

### Flujo típico

```bash
git checkout develop && git pull
git checkout -b feature/mi-cambio
# ... trabajo ...
git push -u origin HEAD
gh pr create --base develop --title "feat: mi cambio"
```

## Fases

| Fase | Estado | Contenido |
|------|--------|-----------|
| 0 | Hecha | Docs + scaffold |
| 1 | Hecha | Auth + usuarios + escuela + roles |
| 2 | Hecha | Clases + muro + Firebase Storage |
| 3 | Hecha | Tareas / equipos / entregas / grades |
| 4 | Pendiente | Exámenes |
| 5 | Pendiente | Notificaciones + SMTP |
| 6 | Pendiente | Padres + admin + pulido UX |

## Tests

```bash
pnpm test
```

- `@sca/shared` — Vitest (schemas Zod)
- `@sca/api` — Jest (health + AuthService)
- `@sca/web` — Vitest (api-client)

## Adjuntos (Fase 3)

- Tipos: **PDF**, **DOC/DOCX**, **imágenes** (jpeg/png/gif/webp) y **links** http/https
- Tamaño máximo por archivo: **10 MB** (límite práctico para secundaria; configurable en `MAX_UPLOAD_BYTES`)


Definí `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en tu `.env` (ver `.env.example`).  
**Nunca** uses esas credenciales en producción ni subas un `.env` real.

## Licencia

Uso privado / escolar — definir con el propietario del proyecto.
