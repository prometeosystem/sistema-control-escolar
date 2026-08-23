# Estructura de archivos del monorepo

```
/
├── apps/
│   ├── web/                          # Next.js (App Router)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/                  # rutas y layouts
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── classes/
│   │   │   │   ├── feed/
│   │   │   │   ├── assignments/
│   │   │   │   ├── exams/
│   │   │   │   ├── grades/
│   │   │   │   ├── parents/
│   │   │   │   ├── admin/
│   │   │   │   └── notifications/
│   │   │   ├── entities/             # tipos de UI alineados a shared
│   │   │   └── shared/
│   │   │       ├── ui/
│   │   │       ├── hooks/
│   │   │       ├── api-client/
│   │   │       └── lib/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                          # NestJS
│       ├── prisma/
│       │   ├── schema.prisma         # ER fuente de verdad
│       │   └── seed.ts
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── common/               # guards, filters, decorators
│       │   ├── prisma/
│       │   └── modules/
│       │       ├── auth/
│       │       ├── users/
│       │       ├── schools/
│       │       ├── cycles/
│       │       ├── classes/
│       │       ├── posts/
│       │       ├── assignments/
│       │       ├── submissions/
│       │       ├── exams/
│       │       ├── grades/
│       │       ├── parents/
│       │       ├── files/
│       │       ├── notifications/
│       │       ├── mail/
│       │       └── admin/
│       ├── package.json
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                       # Zod schemas + tipos API
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── tsconfig/
│   │   ├── base.json
│   │   └── package.json
│   └── eslint-config/
│       ├── index.js
│       └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── diagrama-er.md
│   ├── diagrama-clases.md
│   ├── api-endpoints.md
│   ├── estructura-archivos.md
│   ├── manual-desarrollo.md
│   ├── gitflow.md
│   └── ux-heuristics.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Convención por feature (web)

Cada feature suele contener:

```
features/<nombre>/
  components/
  hooks/
  api.ts          # llamadas al backend
  types.ts
  index.ts
```

## Convención por módulo (api)

```
modules/<nombre>/
  <nombre>.module.ts
  <nombre>.controller.ts
  <nombre>.service.ts
  dto/
```
