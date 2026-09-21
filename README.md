# NestJS Boilerplate

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

Professional, production-ready NestJS boilerplate built with TypeScript strict mode, TypeORM, PostgreSQL, Zod validation and JWT authentication.

It is designed as a starting point for real-world APIs, with a clean modular architecture, automated tests, Docker support and CI.

---

## Table of contents

1. [Highlights](#highlights)
2. [Tech stack](#tech-stack)
3. [Architecture overview](#architecture-overview)
4. [Directory structure](#directory-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Database, migrations and seeds](#database-migrations-and-seeds)
8. [Running the application](#running-the-application)
9. [Testing](#testing)
10. [Docker](#docker)
11. [API conventions](#api-conventions)
12. [Swagger / API docs](#swagger--api-docs)
13. [Authentication flow](#authentication-flow)
14. [Creating new modules](#creating-new-modules)
15. [Creating schemas, entities and migrations](#creating-schemas-entities-and-migrations)
16. [Conventions and best practices](#conventions-and-best-practices)
17. [CI](#ci)
18. [Deploying](#deploying)
19. [License](#license)

---

## Highlights

- Modular Clean Architecture with explicit boundaries between layers.
- TypeScript strict mode.
- Environment validation through Zod with fail-fast boot.
- Zod-based request validation (`body`, `params`, `query`) with `nestjs-zod`.
- TypeORM with PostgreSQL, migrations, soft-delete, unique indexes.
- Argon2id password hashing.
- JWT access tokens + opaque rotating refresh tokens stored hashed in DB.
- Global throttling, helmet, CORS, structured logging (Pino).
- Global exception filter returning a consistent error envelope.
- Swagger with bearer auth, paginated response envelope, request ids.
- Health check that probes the database.
- Unit tests (Jest) + e2e tests (Supertest).
- Multi-stage Docker image and dev compose with PostgreSQL.
- GitHub Actions CI pipeline (lint, typecheck, test, build, migrations).

---

## Tech stack

| Concern | Library |
| --- | --- |
| Framework | NestJS 11 |
| Language | TypeScript 5.7 (strict) |
| Validation | Zod 4 + nestjs-zod |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 16 |
| Auth | @nestjs/jwt, passport-jwt |
| Hashing | argon2 |
| Logging | nestjs-pino, pino-http, pino-pretty |
| Docs | @nestjs/swagger |
| Security | helmet, @nestjs/throttler |
| Tests | Jest 30, Supertest 7 |
| Tooling | pnpm 9, ESLint 9, Prettier 3 |

---

## Architecture overview

The project follows a **modular Clean Architecture** style:

- **Domain entities** (`*.entity.ts`) represent persistence tables and live in their module.
- **Schemas** (`schemas/*.schema.ts`) describe input validation contracts using Zod. DTO types are inferred from schemas.
- **Repositories** isolate persistence. Controllers and services never call TypeORM directly outside of repositories.
- **Services** hold use cases / application rules.
- **Controllers** are thin HTTP adapters (validation, response shaping, auth wiring).
- **Common** (`src/common/*`) hosts cross-cutting concerns: filters, interceptors, decorators, guards, exceptions, pipes, middleware, logger.
- **Shared** (`src/shared/*`) hosts cross-cutting types and constants used by multiple modules.

Allowed dependencies between layers (top can import bottom, never the reverse):

```
Controllers  ->  Services  ->  Repositories  ->  TypeORM/DB
      \             \              /
         \             \-> Schemas (Zod)
            \-> Common / Shared (types, exceptions)
```

Modules must not depend on each other unless explicitly required (e.g. `AuthModule` depends on `UsersModule`). Avoid circular dependencies.

---

## Directory structure

```
.
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   ├── exceptions/
│   │   ├── logger/
│   │   └── utils/
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── data-source.ts
│   │   ├── migrations/
│   │   └── seeds/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   └── health/
│   └── shared/
│       ├── constants/
│       ├── contracts/
│       └── types/
├── test/
│   ├── helpers/
│   ├── auth.e2e-spec.ts
│   └── health.e2e-spec.ts
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
├── jest.config.ts
├── jest.e2e.config.ts
├── .env.example
└── README.md
```

Inside each business module:

```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.repository.ts
├── <name>.entity.ts
├── dto/
├── schemas/
├── interfaces/
└── tests/
```

---

## Getting started

### Prerequisites

- Node.js >= 20 (LTS recommended: 22).
- pnpm >= 9 (`corepack enable && corepack prepare pnpm@9 --activate`).
- Docker + Docker Compose (for local Postgres), OR a local PostgreSQL 14+ instance.
- A working OpenSSL/Node crypto for JWT signing.

### 1. Clone and install

```bash
git clone <your-fork-url> nestjs-boilerplate
cd nestjs-boilerplate
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env` (see [Environment variables](#environment-variables)).

### 3. Start the database

Option A — Docker Compose (recommended):

```bash
docker compose up -d postgres
```

Option B — use your own PostgreSQL and update `.env`.

### 4. Run migrations

```bash
pnpm migration:run
```

### 5. Run the seed (creates an admin user and a normal user)

```bash
pnpm seed:run
```

Default credentials are written to the terminal by the seed script. **Change them in any non-development environment.**

### 6. Start the dev server

```bash
pnpm start:dev
```

Open:

- API base URL: <http://localhost:3000/api/v1>
- Swagger docs: <http://localhost:3000/docs>

---

## Environment variables

All variables are validated at boot via `src/config/env.schema.ts`. Invalid values cause the application to fail fast.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | no | `development` \| `test` \| `production` |
| `PORT` | no | HTTP port (default 3000) |
| `APP_NAME` | no | Display name (Swagger title) |
| `API_PREFIX` | no | Route prefix (default `api/v1`) |
| `API_VERSION` | no | Documented API version |
| `CORS_ORIGINS` | no | Comma-separated allowed origins (or `*`) |
| `DOCS_ENABLED` | no | Enable Swagger (`true`/`false`) |
| `DOCS_PATH` | no | Swagger path (default `docs`) |
| `DB_HOST` | yes | PostgreSQL host |
| `DB_PORT` | yes | PostgreSQL port |
| `DB_USERNAME` | yes | PostgreSQL user |
| `DB_PASSWORD` | yes | PostgreSQL password |
| `DB_DATABASE` | yes | Database name |
| `DB_LOGGING` | no | Enable TypeORM query logging |
| `DB_SYNCHRONIZE` | no | **Never** enable in production |
| `DB_MIGRATIONS_RUN` | no | Run migrations at boot |
| `DB_POOL_MAX` | no | Pool size (default 10) |
| `JWT_SECRET` | **yes** | Access token secret (>= 32 chars) |
| `JWT_ACCESS_TTL` | no | e.g. `15m` |
| `JWT_REFRESH_SECRET` | **yes** | Refresh token secret (>= 32 chars) |
| `JWT_REFRESH_TTL` | no | e.g. `7d` |
| `BCRYPT_ROUNDS` | no | Argon2 memory cost hint (default 12) |
| `REFRESH_TOKEN_COOKIE` | no | Send refresh token as httpOnly cookie |
| `REFRESH_TOKEN_COOKIE_NAME` | no | Cookie name (default `rt`) |
| `COOKIE_SECURE` | no | Set `Secure` flag on cookies |
| `COOKIE_SAMESITE` | no | `lax` \| `strict` \| `none` |
| `THROTTLE_TTL` | no | Throttle window in seconds |
| `THROTTLE_LIMIT` | no | Max requests per window |
| `LOG_LEVEL` | no | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |

Generate strong secrets with:

```bash
openssl rand -base64 48
```

---

## Database, migrations and seeds

This project uses TypeORM migrations, **never** `synchronize: true` in production.

Common scripts:

```bash
pnpm migration:generate src/database/migrations/MyChange  # generate from entities
pnpm migration:create src/database/migrations/MyChange    # empty migration
pnpm migration:run                                       # apply pending
pnpm migration:revert                                    # rollback last
pnpm seed:run                                            # run development seeds
```

Migrations list lives in `src/database/migrations/`. A new module should:

1. Define an entity class in its module folder.
3. Register the entity in `src/database/database.module.ts` and `src/database/data-source.ts`.
2. Generate / write a migration.
3. Run `pnpm migration:run`.

---

## Running the application

| Script | Description |
| --- | --- |
| `pnpm start:dev` | Start with hot reload (uses `.env`). |
| `pnpm start:debug` | Start with hot reload + debugger on `9229`. |
| `pnpm build` | Compile to `dist/`. |
| `pnpm start` | Run the compiled app (`node dist/main.js`). |
| `pnpm start:prod` | Alias to `pnpm start` with `NODE_ENV=production`. |

---

## Testing

| Script | Description |
| --- | --- |
| `pnpm test` | Unit tests (Jest), no DB required. |
| `pnpm test:watch` | Watch mode for unit tests. |
| `pnpm test:cov` | Unit tests with coverage. |
| `pnpm test:e2e` | End-to-end tests (requires PostgreSQL). |
| `pnpm test:debug` | Node-inspector driven tests. |

E2E tests connect to the database configured by the active `.env`. They will fail gracefully if the DB is unreachable.

---

## API conventions

All endpoints are prefixed with `/api/v1`.

### Success responses

Single resource:

```json
{
  "data": { "id": "uuid", "name": "Jane" }
}
```

Paginated list:

```json
{
  "data": [ { "id": "uuid" } ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error responses

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": { "issues": [{ "path": "email", "message": "Invalid email" }] },
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

`code` is a machine-readable identifier (e.g. `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`).

### Status codes

| Code | When |
| --- | --- |
| 200 | OK |
| 201 | Resource created |
| 204 | No content (delete) |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (role) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 422 | Unprocessable entity |
| 429 | Rate limit |

### Headers

- `Authorization: Bearer <accessToken>` for protected routes.
- `X-Request-Id`: client-provided correlation id. Echoed in response and included in logs.
- Every response includes `X-Request-Id`.

---

## Swagger / API docs

Swagger UI is served at `/docs` by default. The path is configurable via `DOCS_PATH`.

It includes:

- Bearer authentication via the "Authorize" button.
- Zod-inferred request bodies and query schemas.
- Standard response envelopes (data + meta for paginated routes).
- Error envelopes for 400/401/403/404/409/422.

---

## Authentication flow

1. `POST /api/v1/auth/register` — create a regular user.
2. `POST /api/v1/auth/login` — returns `accessToken` (JWT) + `refreshToken` (opaque). The refresh token is also set as an httpOnly cookie when `REFRESH_TOKEN_COOKIE=true`.
3. `GET /api/v1/auth/me` — returns the current user (Bearer access token required).
4. `POST /api/v1/auth/refresh` — rotate the refresh token. Each refresh revokes the previous refresh token; reusing a revoked refresh token revokes the entire family (security).
5. `POST /api/v1/auth/logout` — revoke the current refresh token (or all of the user's sessions if no token is provided).

### Token storage

- **Access token**: short TTL (default 15 minutes). Stored client-side (memory). Never persisted to disk.
- **Refresh token**: opaque (64 bytes, base64url). The DB stores **only** its `sha256` hash + metadata (issued IP, user agent, expiry, replaced-by, revoked-at). It is rotated on every refresh.

### Password hashing

- Argon2id with the OWASP-recommended baseline. Plaintext passwords never leave the request handler.

### Cookies

When `REFRESH_TOKEN_COOKIE=true`, the refresh token is set as:

```
HttpOnly; SameSite=Lax; Path=/; Secure (only if COOKIE_SECURE=true); Max-Age=7d
```

Set `COOKIE_SECURE=true` in production. `SameSite=None` requires `Secure=true`.

---

## Creating new modules

1. Create the module folder under `src/modules/<name>/`.
2. Add the entity in `<name>.entity.ts`.
3. Add a schema in `schemas/<name>.schema.ts` (Zod).
4. Add a repository (`<name>.repository.ts`).
5. Add a service (`<name>.service.ts`) that uses the repository and exposes use cases.
6. Add a controller (`<name>.controller.ts`) with `@Body() body: z.infer<typeof schema>` parameters.
7. Register the module in `src/app.module.ts` and add the entity to `src/database/database.module.ts` + `src/database/data-source.ts`.
8. Write tests under `tests/`.

Example minimal controller:

```ts
@Post()
@HttpCode(HttpStatus.CREATED)
@ZodResponse({ status: HttpStatus.CREATED, type: MyDto })
create(@Body() body: CreateInput) {
  return this.service.create(body);
}
```

---

## Creating schemas, entities and migrations

### Schemas

```ts
// src/modules/users/schemas/create-user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

The `ZodValidationPipe` is registered globally with `APP_PIPE`, so any `@Body() input: CreateUserInput` is automatically validated.

### Entities

Use TypeORM decorators. Always set explicit column lengths and uniqueness where applicable.

### Migrations

```bash
pnpm migration:generate src/database/migrations/AddUsersIndex
```

This will create a file in `src/database/migrations/`. Review it, then commit and run:

```bash
pnpm migration:run
```

---

## Conventions and best practices

- TypeScript `strict: true` everywhere. Avoid `any`.
- Validation only via Zod. Never use `class-validator` outside `@nestjs/swagger` peer requirements.
- Services return DTOs / Views, never raw entities.
- Controllers are thin.
- Repositories encapsulate DB access; do not call `EntityManager` from services.
- Errors should be thrown via `DomainException` subclasses for consistent handling.
- Add request IDs (`X-Request-Id`) to all logs. The middleware is enabled globally.
- Sensitive fields (password, refresh tokens, cookies) are redacted by Pino.

---

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`:

1. `pnpm install`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
6. Starts PostgreSQL service
7. `pnpm migration:run`
8. `pnpm test:e2e`

Add the same secrets/variables in your repo settings if you need to test against a managed DB.

---

## Deploying

This project ships with a multi-stage `Dockerfile` and a `docker-compose.yml` ready for both development and production.

### Production image

```bash
docker build -t nestjs-boilerplate:latest .
docker run --rm -p 3000:3000 \
  --env-file .env \
  nestjs-boilerplate:latest
```

For orchestrators (Kubernetes, ECS, etc.) ensure you provide the `DATABASE_URL` (or the individual `DB_*` variables) and the JWT secrets via your secret store.

### Recommended production checklist

- Generate strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (`openssl rand -base64 48`).
- Set `NODE_ENV=production`, `DB_SYNCHRONIZE=false`, `DB_MIGRATIONS_RUN=false` (run migrations as a separate one-off step before deploying).
- Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=lax` (or `strict`/`none` when serving cross-site).
- Use a managed PostgreSQL with TLS.
- Front the API with a TLS-terminating proxy.
- Configure your monitoring / log aggregator to parse the structured Pino logs.

---

## License

MIT.