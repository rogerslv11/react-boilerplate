# NestJS Boilerplate

Base profissional para APIs REST com NestJS 11, Prisma 6, PostgreSQL, Zod 3,
JWT (Argon2), Swagger (OpenAPI), Pino, Docker e testes em Vitest.

> 📘 **[Arquitetura completa](docs/architecture.md)** — leia primeiro.
> 🛠 **[Desenvolvimento](docs/development.md)** — comandos do dia-a-dia.
> 🚀 **[Deploy](docs/deployment.md)** — Docker, produção, CI.

---

## Como rodar

### 1. Subir o banco

```bash
docker compose up -d postgres
```

### 2. Configurar `.env`

```bash
cp .env.example .env
# editar segredos (JWT_SECRET, JWT_REFRESH_SECRET) — use 32+ bytes cada
```

### 3. Migrar e seedar

```bash
npm run prisma:migrate:dev
npm run prisma:seed
```

### 4. Iniciar a API

```bash
npm run start:dev
```

A API sobe em `http://localhost:3000/api/v1`.
Docs (Swagger UI) em `http://localhost:3000/docs`.

Sem Docker (apenas se você já tem Postgres local):

```bash
npm install
export DATABASE_URL=postgresql://app:app@localhost:5432/app_db
npx prisma migrate dev && npm run prisma:seed
npm run start:dev
```

---

## Endpoints essenciais

| Method | Path                         | Descrição                       |
|--------|------------------------------|---------------------------------|
| POST   | `/api/v1/auth/register`      | Cria usuário, devolve tokens    |
| POST   | `/api/v1/auth/login`         | Login                           |
| POST   | `/api/v1/auth/refresh`       | Rotação de refresh              |
| GET    | `/api/v1/auth/me`            | Perfil (Bearer)                 |
| GET    | `/api/v1/users`              | Lista paginada (Admin)          |
| POST   | `/api/v1/users`              | Cria usuário (Admin)            |
| GET    | `/api/v1/users/me`           | Perfil (Bearer)                 |
| PATCH  | `/api/v1/users/:id`          | Atualiza                        |
| PATCH  | `/api/v1/users/:id/password` | Troca senha                     |
| DELETE | `/api/v1/users/:id`          | Remove (Admin)                  |
| GET    | `/api/v1/health/liveness`    | Up                               |
| GET    | `/api/v1/health/readiness`   | DB OK                            |

Autenticação: `Authorization: Bearer <accessToken>`.

---

## Comandos rápidos

```bash
npm run start:dev          # Nest em watch
npm run build              # Build de produção
npm run start:prod         # Roda build (node dist/src/main.js)
npm run lint               # ESLint
npm run format             # Prettier
npm run typecheck          # tsc --noEmit
npm test                   # Vitest (unit)
npm run test:cov           # Vitest com cobertura
npm run prisma:generate    # prisma generate
npm run prisma:migrate:dev # migration + dev
npm run prisma:migrate:deploy # produção
npm run prisma:seed
```

---

## Credenciais seed

- Admin: `admin@boilerplate.local` / `Admin@123456`
- User:  `user@boilerplate.local`  / `User@123456`

> **Troque-as antes de qualquer deploy.** São apenas para primeiro acesso.

---

## Estrutura (resumo)

Ver `docs/architecture.md`.

```
src/
├── main.ts            # bootstrap (env, helmet, cors, swagger)
├── app.module.ts      # composição de módulos
├── config/            # env + registerAs
├── shared/            # tipos e constantes compartilhadas
├── common/            # filtros, pipes, decorators, exceptions
├── infrastructure/    # Prisma (global)
└── modules/           # auth, users, health
```

---

## Licença

MIT.
