# Manual de desarrollo

## 1. Requisitos

- Node.js **20+**
- **pnpm** 9+
- Docker + Docker Compose
- Cuenta Firebase (Storage) para archivos
- Credenciales SMTP para correos

## 2. Setup local

```bash
# Clonar e instalar
pnpm install

# Variables de entorno
cp .env.example .env
# Completar DATABASE_URL, JWT_*, FIREBASE_*, SMTP_*

# Infra local (Postgres)
docker compose up -d postgres

# Migraciones (cuando exista schema de dominio)
pnpm --filter @sca/api prisma:migrate
pnpm --filter @sca/api prisma:seed

# Desarrollo
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/v1  

## 3. Variables de entorno

Ver `.env.example` en la raíz. Resumen:

| Grupo | Variables |
|-------|-----------|
| DB | `DATABASE_URL` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Apps | `NEXT_PUBLIC_API_URL`, `API_PORT` |

## 4. Convenciones

- TypeScript estricto en apps y packages
- Nombres: `camelCase` vars/funcs, `PascalCase` componentes/clases, `kebab-case` archivos de ruta
- Commits [Conventional Commits](./gitflow.md): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Contratos API primero en `packages/shared` (Zod), luego backend, luego frontend
- Un módulo Nest = un dominio; una feature Next = un dominio de UI

## 5. GitFlow

Obligatorio. Detalle completo: [gitflow.md](./gitflow.md). Resumen también en el [README](../README.md).

Flujo típico de feature:

1. `git checkout develop && git pull`
2. `git checkout -b feature/<nombre>`
3. Contrato en `packages/shared` → API → Web
4. PR hacia `develop` (CI verde + review)
5. Release: `release/x.y.z` → `main` + tag → merge back a `develop`

## 6. Auth en el cliente

- Access token en memoria (o cookie httpOnly si se implementa BFF)
- Refresh token en cookie httpOnly preferible; v1 puede usar storage seguro con rotación
- Interceptor del api-client: en 401 intenta refresh una vez; si falla, logout

## 7. Checklist UX en PRs de UI

Ver [ux-heuristics.md](./ux-heuristics.md). Todo PR de frontend debe marcar el checklist.

## 8. Despliegue VPS

```bash
docker compose build
docker compose up -d
```

- Nginx termina TLS y enruta `/` → web, `/api` → api
- Secrets solo en el servidor
- Backup diario de Postgres
- Configurar bucket Firebase + reglas restrictivas
- Probar SMTP con un correo de prueba antes de producción

## 9. Fases posteriores a Fase 0

1. Auth + usuarios + escuela + roles  
2. Clases + muro + Firebase Storage  
3. Tareas / equipos / entregas / grades  
4. Exámenes  
5. Notificaciones + SMTP  
6. Padres + admin + pulido UX  

## 10. Scripts útiles (raíz)

| Script | Acción |
|--------|--------|
| `pnpm dev` | turbo dev (web + api) |
| `pnpm build` | build de todo |
| `pnpm lint` | lint |
| `pnpm --filter @sca/api prisma:studio` | explorar DB |
