# Architecture

> Companion document to the `README.md`. Describes the project structure, the
> architectural decisions and the conventions you must follow when adding new
> code.

## 1. Architectural style

The project follows a **modular Clean Architecture** style with three layers
per business module:

```
┌──────────────────────────────────────────────────────────────┐
│  Controllers  (HTTP adapters, validation, auth wiring)       │
├──────────────────────────────────────────────────────────────┤
│  Services     (use cases, application rules, transactions)   │
├──────────────────────────────────────────────────────────────┤
│  Repositories (TypeORM adapters, query construction)         │
└──────────────────────────────────────────────────────────────┘
           ▲                ▲                ▲
           │ uses           │ uses           │ uses
           │                │                │
       DTOs / Views     Schemas (Zod)     Entities
```

Cross-cutting concerns live in `src/common` and `src/shared`:

- **`src/common`** — Nest-specific glue: filters, interceptors, middleware,
  decorators, logger, exception classes, response contracts, generic
  utilities. **These depend on NestJS.**
- **`src/shared`** — Framework-agnostic types, constants and contracts reused
  by multiple modules. **These do NOT depend on NestJS.**

The dependency rule is:

> `common` and `shared` may not depend on `modules`.
> `modules` may depend on `common` and `shared`.
> A module must not depend on another module unless explicitly required.

## 2. Directory layout

```text
src/
├── main.ts                     # bootstrap: helmet, cors, swagger, listen
├── app.module.ts               # composition root
│
├── config/                     # typed config loaders + env schema
│   ├── env.schema.ts           # Zod schema that validates process.env
│   ├── app.config.ts           # app-level settings (port, prefix, cors, ...)
│   ├── database.config.ts      # DB connection settings
│   ├── auth.config.ts          # JWT, refresh, cookie settings
│   ├── swagger.config.ts       # SwaggerModule setup
│   └── __tests__/              # unit tests for env schema
│
├── database/
│   ├── database.module.ts      # TypeOrmModule.forRootAsync
│   ├── data-source.ts          # CLI-only DataSource (for migrations / seeds)
│   ├── migrations/             # versioned, never use synchronize in prod
│   └── seeds/                  # dev seeds, run with pnpm seed:run
│
├── common/                     # cross-cutting Nest glue (see above)
│   ├── contracts/              # response envelope types
│   ├── decorators/             # @CurrentUser, @RequestId, @IpAddress
│   ├── exceptions/             # DomainException + semantic subclasses
│   ├── filters/                # global AllExceptionsFilter
│   ├── interceptors/           # ResponseTransformInterceptor
│   ├── logger/                 # nestjs-pino configuration
│   ├── middleware/             # request id middleware
│   └── utils/                  # tiny generic helpers (uuidParamSchema)
│
├── shared/                     # framework-agnostic types & constants
│   ├── constants/
│   ├── contracts/              # JwtPayload, RequestUser, AuthenticatedUser
│   └── types/                  # pagination helpers
│
└── modules/                    # business modules
    ├── health/                 # liveness + readiness probe
    ├── auth/                   # JWT, refresh rotation, argon2
    └── users/                  # CRUD with pagination & soft delete
```

Each business module follows the same shape:

```text
modules/<name>/
├── <name>.module.ts            # Nest module definition
├── <name>.controller.ts        # HTTP layer (thin)
├── <name>.service.ts           # use cases (one or more services)
├── <name>.repository.ts        # TypeORM adapter (only if needed)
├── <name>.entity.ts            # TypeORM entity (only if needed)
│
├── dto/                        # response shapes for Swagger
├── schemas/                    # Zod schemas + createZodDto classes
├── decorators/                 # module-specific decorators (e.g. @Roles)
├── guards/                     # module-specific guards (e.g. JwtAuthGuard)
├── strategies/                 # passport strategies (only for auth)
├── services/                   # extra services (e.g. TokenService)
├── interfaces/                 # data shapes (UserView) — NOT TypeORM entities
└── tests/                      # *.spec.ts unit tests
```

## 3. Layer responsibilities

### Controllers (`*.controller.ts`)

- Define routes and HTTP verbs.
- Run Zod validation through the global `ZodValidationPipe`.
- Pull the authenticated user from `@CurrentUser()`.
- Apply guards (`@UseGuards(JwtAuthGuard, RolesGuard)`) and decorators.
- Return data (a service result, a view, or `void` for `204`).
- **Never** call the repository or TypeORM directly.
- **Never** implement business rules.

### Services (`*.service.ts`)

- Contain the use cases: orchestration, transactions, authorisation checks
  that are not pure role checks, password hashing, calling other services.
- Throw `DomainException` subclasses on errors.
- Return **views** (DTO-like shapes) instead of entities.
- Receive **plain inputs** (already validated by Zod) from the controller.

### Repositories (`*.repository.ts`)

- Encapsulate TypeORM access for a single entity.
- Expose intent-revealing methods (`findByEmail`, `softDelete`, ...) rather
  than leaking `Repository<T>` everywhere.
- Are injected into services, never into controllers.

### Entities (`*.entity.ts`)

- Pure TypeORM decorators + column definitions.
- **Never** returned to the API surface. Convert to a `UserView` (or
  similar) before sending.

### Schemas (`schemas/*.schema.ts`)

- Define input validation with Zod.
- Export both the schema and a ZodDto class created via
  `createZodDto(schema)`.
- The ZodDto is what the controller parameters are typed with — this is
  what activates the global `ZodValidationPipe`.

```ts
// users/schemas/create-user.schema.ts
export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
```

### DTOs (`dto/*.dto.ts`)

- Plain classes with `@ApiProperty()` decorators used by Swagger.
- Describe **response** shapes only.
- Used on `@ApiOkResponse({ type: MyResponseDto })`.

## 4. Validation flow

```
HTTP body / query / params
        │
        ▼
  ZodValidationPipe (global)
        │   validates via metadata attached by createZodDto
        ▼
  Controller (typed with the ZodDto)
        │   calls a service method
        ▼
  Service (validates business rules, throws DomainException)
        │   delegates persistence
        ▼
  Repository (TypeORM)
        │
        ▼
  Entity → mapped to a View → wrapped by ResponseTransformInterceptor
        │
        ▼
  { "data": ..., "meta"?: ... }   (paginated envelope)
```

## 5. Authentication & authorisation

- `auth/services/token.service.ts` signs and verifies JWTs and exposes
  access / refresh TTL helpers. It receives its configuration through the
  module factory, so it does **not** import `@nestjs/config` directly — this
  keeps it testable.
- `auth/services/refresh-token.service.ts` issues, rotates and revokes
  opaque refresh tokens. Tokens are stored only as `sha256` hashes in the
  `refresh_tokens` table, with `revoked_at`, `replaced_by`, `expires_at`,
  `user_agent` and `ip_address` metadata.
- `auth/strategies/jwt.strategy.ts` is the Passport JWT strategy. It
  loads the user from the database on each request and populates
  `req.user = { id, email, role }`.
- `auth/guards/jwt-auth.guard.ts` is a thin wrapper over `AuthGuard('jwt')`.
- `auth/guards/roles.guard.ts` reads `@Roles(...)` metadata and rejects with
  `INSUFFICIENT_ROLE` when the current user's role is not allowed.
- `auth/decorators/roles.decorator.ts` is the `@Roles('admin')` decorator.
- `@CurrentUser()` (from `src/common/decorators`) gives controllers access
  to the authenticated user.

### Refresh token rotation

```
client ──POST /auth/refresh { refreshToken: <opaque> }──▶ service
                                                            │
        verify JWT signature & extract userId (sub) ◀──────┤
                                                            │
        look up refresh_tokens row by sha256(tokenHash) ◀──┤
                                                            │
        if revoked: REVOKE ALL TOKENS FOR USER (reuse detection)
                                                            │
        issue new opaque token + insert new row
        mark old row revoked_at = now(), replaced_by = newId
                                                            │
client ◀── { accessToken, refreshToken } ───────────────────┘
```

## 6. Error handling

All exceptions are funnelled through `common/filters/all-exceptions.filter.ts`,
which produces a consistent envelope:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": { "issues": [...] },
  "requestId": "uuid",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/..."
}
```

The `code` field is a machine-readable identifier:
`VALIDATION_ERROR`, `NOT_FOUND`, `EMAIL_ALREADY_EXISTS`,
`INVALID_CREDENTIALS`, `INSUFFICIENT_ROLE`, `INTERNAL_ERROR`, etc.

The filter handles, in order:

1. `DomainException` subclasses (semantic HTTP errors).
2. `ZodValidationException` (from `nestjs-zod`, decorated with
   `code = VALIDATION_ERROR` and structured `issues`).
3. Plain `ZodError` (defensive, in case a Zod schema throws outside the
   pipe).
4. Generic `HttpException` (NestJS built-ins).
5. Unknown errors (mapped to `500 INTERNAL_ERROR`; stack trace hidden in
   production).

Services throw `DomainException` instead of generic `HttpException`:

```ts
throw new ConflictDomainException('Email already in use', 'EMAIL_ALREADY_EXISTS', {
  email: input.email,
});
```

## 7. Request lifecycle

```
Request ──▶ helmet, cookie-parser ──▶ CORS check
        ──▶ RequestIdMiddleware (X-Request-Id propagated / generated)
        ──▶ ThrottlerGuard (100 req / 60 s by default)
        ──▶ JwtAuthGuard (per controller)
        ──▶ RolesGuard (when @Roles is set)
        ──▶ ZodValidationPipe (body, query, params)
        ──▶ Controller ──▶ Service ──▶ Repository ──▶ DB
        ──▶ ResponseTransformInterceptor (wraps single / paginated)
        ──▶ AllExceptionsFilter (only on errors)
        ──▶ Pino logs (structured, redacted)
```

## 8. Module dependency graph

```
HealthModule ─▶ DatabaseModule ─▶ TypeORM
AuthModule    ─▶ UsersModule ─▶ DatabaseModule
UsersModule   ─▶ DatabaseModule
```

- `AuthModule` depends on `UsersModule` to issue tokens for registered
  users and to look up profiles.
- No circular dependencies. New modules should follow the same pattern:
  depend only on the modules they genuinely need.

## 9. Configuration

- `process.env` is validated once at boot by `env.schema.ts` (Zod). Any
  invalid value causes the application to fail fast.
- Typed configuration namespaces (`app`, `database`, `auth`) are produced
  via `registerAs(...)` and consumed with `configService.getOrThrow<T>(...)`.
- Each loader does its own type coercion (numbers, booleans, comma lists),
  because `@nestjs/config` does not run the Zod `transform` for loaders.

Required at boot: `JWT_SECRET`, `JWT_REFRESH_SECRET` (each ≥ 32 chars).
Everything else has a development default.

## 10. Database, migrations and seeds

- **Never** enable `synchronize: true` in production. The default is
  `false`.
- Migrations live in `src/database/migrations/`. They are versioned by a
  numeric prefix.
- The `DataSource` (`src/database/data-source.ts`) is used by the TypeORM
  CLI **only**. At runtime the app uses `TypeOrmModule.forRootAsync` which
  reads `.env`.
- Run migrations manually in CI:

  ```bash
  pnpm migration:run
  ```

- Seeds are deliberately simple. They create one admin and one regular
  user with default passwords that **must be rotated** outside
  development.

## 11. Observability

- All logs are emitted via `nestjs-pino` with redaction of
  `password`, `currentPassword`, `newPassword`, `token`,
  `refreshToken`, `authorization` headers, `cookie` header and
  `set-cookie` response header.
- Each request carries an `X-Request-Id` (echoed in the response) which
  appears on every log line and on every error envelope.
- The health endpoint (`GET /api/v1/health`) probes the database and
  returns a structured status:

  ```json
  { "status": "ok", "database": { "status": "up", "latencyMs": 2 }, ... }
  ```

## 12. Conventions

### Naming
- File names use the singular module name: `users.service.ts`,
  `users.controller.ts`, `users.repository.ts`, `users.entity.ts`.
- Schema files are descriptive: `create-user.schema.ts`,
  `update-user.schema.ts`, `query-user.schema.ts`.
- DTOs follow the same pattern: `user-response.dto.ts`,
  `paginated-users.dto.ts`.

### Validation
- All request validation goes through Zod. There is no `@Body() @Type()`
  / class-validator pattern.
- Validation messages are descriptive (`'Password must be at least 8
  characters'`), not cryptic.
- Email schemas lower-case their value via `.transform((v) =>
  v.toLowerCase())`.

### Persistence
- Repositories hide TypeORM. Services never call `repository.findOne`,
  `createQueryBuilder`, etc.
- Entities are never returned to clients. Always convert to a view.
- Soft-delete is the default. Add a hard-delete operation only when
  compliance requires it.

### Errors
- Use the most specific `DomainException` subclass.
- Always include a stable `code` string.
- Avoid leaking internal details in `details` for 5xx responses.

### TypeScript
- `strict: true` everywhere.
- Avoid `any`. Use `unknown` at boundaries and narrow.
- Don't duplicate types that can be inferred (`z.infer`, return types).
- Constructor parameter properties (`constructor(private readonly foo:
  FooService) {}`) are preferred over explicit field declarations.

### Module size
- One module = one bounded context. If a service starts importing from
  many other modules, it's a smell — split the context.

## 13. Adding a new module (checklist)

1. `mkdir src/modules/<name> && cd $_`.
2. Create the entity (`<name>.entity.ts`), add it to `database.module.ts`
   **and** `data-source.ts`.
3. Write a Zod schema and ZodDto for each input shape
   (`create-...`, `update-...`, `query-...`, `id-param.schema.ts`).
4. Create a repository (`<name>.repository.ts`) if the module owns its
   persistence.
5. Implement the service (`<name>.service.ts`) with explicit use cases.
   Throw `DomainException` on errors.
6. Add a controller (`<name>.controller.ts`) using `@Body()/@Query()/
   @Param()` typed with the ZodDto.
7. Define the module (`<name>.module.ts`) and import it from
   `app.module.ts`.
8. Write `tests/<name>.service.spec.ts` and `tests/<name>.schemas.spec.ts`.
9. Generate a migration: `pnpm migration:generate src/database/migrations/
   Create<Name>Table`.
10. Run `pnpm migration:run` locally and verify the schema.
11. If the module has a swagger surface, add a tag in
    `config/swagger.config.ts`.

## 14. Why not X?

- **NestJS Resources / `Request` / `Response` objects as DTOs.** They
  bleed transport details into the domain.
- **class-validator.** We standardised on Zod for richer types and better
  inference. `class-validator` is only kept as a transitive peer
  dependency of `@nestjs/swagger`.
- **A generic `BaseRepository<T>`.** It tends to encourage leaky
  abstractions (returning `QueryBuilder`, exposing `EntityManager`) and
  makes unit testing harder. Each module owns its own thin repository.
- **Mongoose / Prisma.** TypeORM fits the SQL + migrations workflow
  better and has stronger transactional guarantees out of the box.
- **A custom DI container.** NestJS's container already gives us
  scopes, request lifetimes, factories and module-based encapsulation.