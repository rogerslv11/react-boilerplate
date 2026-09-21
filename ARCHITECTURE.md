# Architecture

This document describes how the Sinatra boilerplate is organized, why each layer exists, and how the pieces fit together. Read this before extending the codebase.

---

## 1. Goals and non-goals

**Goals**
- A **stateless JSON API** ready to power SaaS products, multi-tenant apps, admin panels, and any other web backend that needs a backend API layer.
- A **modular Sinatra app** that does not pretend to be a mini-Rails. We use ActiveRecord for persistence because the gem is well-known, but everything else is intentionally small.
- **Predictable structure**: each domain lives in `app/modules/<name>/`. Each module exposes the same surface area (routes, service, repository, contracts, etc.), so adding a new feature never requires new design decisions.

**Non-goals**
- Server-rendered HTML or views.
- Cookie sessions, CSRF tokens for browser forms. We are an API, not a monolith.
- A built-in admin UI. The admin role exists but you ship your own UI (or use the OpenAPI spec).
- Background jobs. We do not depend on Sidekiq or Redis. You can add them as needed.

---

## 2. Request lifecycle

A request goes through this stack, top to bottom:

```
   client
     │
     ▼
┌──────────────────────────────────────────┐
│ Rack::Attack           rate limiting     │
├──────────────────────────────────────────┤
│ Rack::Cors             CORS preflight    │
├──────────────────────────────────────────┤
│ Rack::Protection       XSS, path traversal, JSON CSRF
├──────────────────────────────────────────┤
│ Middleware::RequestId  X-Request-Id      │
├──────────────────────────────────────────┤
│ Middleware::AccessLog  structured logs   │
├──────────────────────────────────────────┤
│ Middleware::Authentication              │
│   parses Bearer token, sets env['current_user']
├──────────────────────────────────────────┤
│ Sinatra app (Application < Sinatra::Base)│
│   - module routes (registered in order) │
│   - controllers call services            │
│   - services call repositories           │
│   - exceptions caught globally          │
└──────────────────────────────────────────┘
     │
     ▼
  PostgreSQL
```

Two things to note:

1. **Middleware is mounted inline** in `app.rb`, not through a class-level DSL. Sinatra::Base mounts middleware when `app::new` (not `new!`) is called. The `config.ru` uses `Application.new` so the middleware stack is wired in.
2. **Authentication is opt-in.** The middleware *parses* the token if one is present, but routes must call `requires_authentication!` or `requires_admin!` to enforce it. Public endpoints (`/health`, `/api/v1/auth/register`, `/api/v1/auth/login`) skip this check.

---

## 3. Module pattern

Every feature lives in `app/modules/<name>/`. The Auth and Users modules are the canonical examples:

```
app/modules/auth/
├── routes.rb                # Mounts HTTP endpoints on the Sinatra app
├── service.rb               # Use cases (register, login, refresh, logout)
├── refresh_token.rb         # ActiveRecord model for refresh tokens
├── refresh_token_repository.rb
└── contracts/auth_contracts.rb

app/modules/users/
├── routes.rb
├── service.rb
├── repository.rb            # Persistence queries
├── model.rb                 # ActiveRecord model
├── contracts/user_contracts.rb
└── serializers/user_serializer.rb
```

Each module owns its slice of HTTP and persistence. There is no global "user controller" or "auth controller" — modules are independent.

### 3.1 Routing without circular dependencies

`config/routes.rb` is the single place where modules are registered:

```ruby
require_relative '../app/modules/health/routes'
require_relative '../app/modules/auth/routes'
require_relative '../app/modules/users/routes'

SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Health::Routes)
SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Auth::Routes)
SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Users::Routes)
```

`Application.register_module` calls `mod.registered(self)` on each module. That hook is where routes are attached:

```ruby
module SinatraBoilerplate
  module Modules
    module Auth
      module Routes
        def self.registered(app)
          app.post '/api/v1/auth/register' do
            # ...
          end
        end
      end
    end
  end
end
```

This pattern avoids `app.post` calls scattered across files and prevents circular requires.

### 3.2 Adding a new module

1. Create `app/modules/<name>/` with `routes.rb`, `service.rb`, and any models/contracts.
2. Add `require_relative '../app/modules/<name>/routes'` and the `register_module` call in `config/routes.rb`.
3. If the module needs persistence, add a migration under `db/migrate/`.
4. Add tests under `spec/requests/<name>/`.

---

## 4. Layering

The app follows a strict layering rule. Lower layers may not import from upper layers:

```
  ┌────────────────────────────────────────┐
  │ routes.rb                              │  HTTP entry point
  ├────────────────────────────────────────┤
  │ controllers/  (auth, users)            │  thin: parse, dispatch, serialize
  ├────────────────────────────────────────┤
  │ services/     (per module)             │  use cases, authorization, transactions
  ├────────────────────────────────────────┤
  │ repositories/ (per module)             │  queries, persistence details
  ├────────────────────────────────────────┤
  │ models/       (per module)             │  ActiveRecord + validations
  └────────────────────────────────────────┘
```

**Controllers** are intentionally thin. They parse the request, hand off to a service, and serialize the response. They do **not** contain business rules.

**Services** are where authorization, business rules, and transaction boundaries happen live. The `authorize_*!` private methods in `app/modules/users/service.rb` are the canonical authorization rules for that module.

**Repositories** centralize queries. They keep SQL details out of services. Repositories return ActiveRecord models or collections; they don't return serialized JSON.

**Models** define associations, validations, and any model-specific helpers. They do **not** know about HTTP.

### Cross-cutting concerns

These live in `lib/core/` and are used by all modules:
- `Errors::*` — typed exception hierarchy (`ApplicationError`, `ValidationError`, `AuthenticationError`, etc.)
- `Responses::Builder` — JSON response envelopes
- `Pagination::Paginator` / `Page` — paginated list responses
- `Utils::JwtEncoder` — JWT signing/verification
- `Utils::PasswordHasher` — BCrypt wrapper
- `Utils::RequestId` — UUID generation

---

## 5. Contracts and validation

Input validation lives in `app/modules/<name>/contracts/<name>_contracts.rb`. Contracts use `dry-validation` (the Ruby counterpart of Zod) and are separate from ActiveRecord validations.

Why split them?
- **ActiveRecord validations** protect the database (e.g., `email` column must be present).
- **Contracts** protect the HTTP boundary (e.g., `password` must be at least 8 chars and contain a digit).

Controllers call the contract before invoking a service. A failure raises `Errors::ValidationError`, which the centralized error handler turns into a `422 VALIDATION_ERROR` response with per-field details.

---

## 6. Error handling

Every error class extends `Errors::ApplicationError`, which carries a status, code, message and details hash. `app.rb` registers a single error handler that catches them:

```ruby
error SinatraBoilerplate::Errors::ApplicationError do
  err = env['sinatra.error']
  SinatraBoilerplate::Responses::Builder.error(
    status: err.status,
    code: err.code,
    message: err.message,
    details: err.details,
    request_id: env['request.id']
  )
end
```

There is also a fallback `error StandardError do ... end` that logs the exception and returns a generic `500 INTERNAL_SERVER_ERROR`. In production, the message is hidden — only `request_id` and a generic message are returned.

The full hierarchy:

| Class                    | Status | Default code              |
| ------------------------ | ------ | ------------------------- |
| `ApplicationError`       | 500    | `INTERNAL_SERVER_ERROR`   |
| `ValidationError`        | 422    | `VALIDATION_ERROR`        |
| `AuthenticationError`    | 401    | `AUTHENTICATION_FAILED`   |
| `AuthorizationError`     | 403    | `FORBIDDEN`               |
| `NotFoundError`          | 404    | `NOT_FOUND`               |
| `ConflictError`          | 409    | `CONFLICT`                |
| `RateLimitError`         | 429    | `RATE_LIMITED`            |

---

## 7. Authentication flow

### 7.1 Token model

- **Access token**: short-lived JWT (default 1h), HS256-signed.
- **Refresh token**: long-lived opaque random string (default 30d), stored as a SHA-256 hash in `refresh_tokens`.

Refresh tokens are stored **only as hashes** in the database. If the database leaks, tokens cannot be replayed.

### 7.2 Rotation

Every call to `/api/v1/auth/refresh` issues a fresh access+refresh pair and revokes the presented refresh token. The revoked token's `replaced_by` column points to the new token's hash prefix, so the chain is traceable.

The current implementation rejects a revoked refresh token with `401 REFRESH_TOKEN_INVALID`. A future enhancement could walk the chain and revoke all descendants on reuse (a common defense against stolen tokens).

### 7.3 Auth middleware vs routes

`Authentication` middleware *parses* the Bearer token if present and stores `env['current_user']`. It does **not** raise — it just decodes. Routes opt-in to authentication:

```ruby
app.get '/api/v1/users' do
  requires_authentication!  # raises AuthenticationError if no current_user
  requires_admin!           # raises AuthorizationError if role != 'admin'
  # ...
end
```

This split keeps public endpoints (`/api/v1/auth/login`, `/health`) simple and protected endpoints explicit.

### 7.4 Authorization rules

Each module owns its authorization rules. The Users service has:

- `authorize_read!(current_user, target)` — admins see anyone; users see themselves.
- `authorize_create!` — admin only.
- `authorize_update!(current_user, target, params)` — admins update anyone; users update themselves but not `role`/`active`.
- `authorize_delete!` — admin only.

If a non-admin tries to update their `role`, the service raises `AuthorizationError` *before* running the contract, so the response is a clean 403 rather than a validation error.

---

## 8. Database and migrations

- **ActiveRecord 8.1** without Rails. The connection is established in `config/database.rb`.
- Migrations live in `db/migrate/` and are run via Rake tasks (`db:migrate`, `db:rollback`, `db:seed`, `db:reset`).
- The test database (`DATABASE_NAME_TEST`) is auto-migrated by `spec_helper.rb`.
- `users` uses a UUID primary key with `pgcrypto` (`gen_random_uuid()`).
- The `users.email` index is **case-insensitive** (`LOWER(email)`) so two accounts with the same email at different casing can't exist.
- Soft-delete is implemented via `deleted_at` on `users`. The repository's `find` and `list` methods filter it out.

---

## 9. Logging

- **Access logs** go through `SinatraBoilerplate::Log.logger` from `Middleware::AccessLog`. Each line is JSON with `method`, `path`, `status`, `duration_ms`, `request_id`, `ip`.
- **Errors** are logged via `SinatraBoilerplate::Log.logger.error` from the `error StandardError` block, with the first 5 stack frames.
- **Request id** is generated by `Middleware::RequestId` (or taken from `X-Request-Id` if the client sends one). It is included in every response header (`X-Request-Id`) and every log line.
- We never log passwords, tokens, JWT secrets, or `password_digest`.

---

## 10. Security

| Concern               | Implementation                                                |
| --------------------- | ------------------------------------------------------------- |
| Password hashing      | BCrypt cost 12 (`BCRYPT_COST` env, default `12`)              |
| Token signing         | HS256 with `JWT_SECRET`                                       |
| Refresh token storage | SHA-256 hash only                                              |
| Rate limiting         | `rack-attack` per-IP and per-login throttles                   |
| CORS                  | `rack-cors` with configurable origins/methods/headers         |
| HTTP protections      | `rack-protection` (frame options, JSON CSRF, path traversal)  |
| SQL injection         | All queries through ActiveRecord                              |
| Sensitive data        | `password_digest` never serialized                             |
| Stack traces          | Hidden in production                                          |
| Brute-force           | `RATE_LIMIT` + login-specific throttle                        |

We intentionally do **not** ship:
- Cookie sessions.
- A CSRF token store (the API uses Bearer tokens, which are not auto-attached by browsers).
- A Redis dependency (would be needed for JWT blacklisting, but we rely on short TTLs).

---

## 11. Configuration

All configuration is via environment variables. Loading order:
1. `dotenv` reads `.env.<env>.local`, then `.env.<env>`, then `.env` (development/test only).
2. `SinatraBoilerplate::Env` exposes a tiny helper around `ENV`.
3. `config/database.rb` reads `DATABASE_*` to build the connection config.
4. `config/application.rb` reads `APP_*` and other settings.
5. Each middleware reads its own env vars (e.g., CORS, rate limiting).

There are no global constants. Every value comes from the environment.

---

## 12. Testing strategy

- **Specs live under `spec/`**, mirroring the source tree.
- **`spec_helper.rb`** loads the application, sets `APP_ENV=test`, runs migrations on the test DB, configures RSpec, and wires DatabaseCleaner with truncation strategy.
- **`spec/support/helpers.rb`** provides `JsonHelpers`, `AuthHelpers`, and `RackHelpers` (the `app` method for Rack::Test).
- **Factories** under `spec/factories/` use FactoryBot.
- **Auth helpers** (`auth_header_for(user)`) generate a valid JWT for a given user.

Run with `bundle exec rspec`. The current suite has 53 examples covering contracts, models, services, requests, and response builders.

---

## 13. Deployment

- The production stage of the Dockerfile creates a non-root user and starts Puma.
- Migrations are **not** run automatically in the entrypoint — run them as a one-shot step (`bundle exec rake db:migrate`) before the app starts. This is a deliberate choice: in a multi-instance deployment, you don't want every instance racing to apply migrations.
- Use `docker compose run --rm app bundle exec rake db:migrate` or a Kubernetes Job.

---

## 14. Extending the codebase

When adding new functionality, follow this order:

1. **Model** (if persistence is needed). Add a migration. Add the ActiveRecord model.
2. **Repository** (queries).
3. **Contract** (input validation).
4. **Service** (use cases and authorization).
5. **Controller** (only if you want HTTP-specific serialization or want to keep the route block small — many routes call services directly).
6. **Routes** (`app.get / post` blocks).
7. **Register** the module in `config/routes.rb`.
8. **Tests** in `spec/requests/<name>/`.

This is the order in which dependencies are introduced: each layer only sees layers below it, never above.

---

## 15. Directory reference

```
app.rb                      Application class (Sinatra::Base), error handlers, helpers
config.ru                  Rack entrypoint
Rakefile                   db:* tasks + rspec + server
Gemfile                    Dependencies
Gemfile.lock               Pinned versions

config/
├── application.rb         Bootstrapping
├── database.rb            ActiveRecord connection
├── environment.rb         Logger, Env helpers
├── routes.rb              Module registry
├── puma.rb                Puma config
└── initializers/
    └── rate_limiting.rb   Rack::Attack rules

app/
├── controllers/
│   ├── auth_controller.rb
│   └── users_controller.rb
├── middleware/
│   ├── request_id.rb
│   ├── access_log.rb
│   └── authentication.rb
└── modules/
    ├── auth/
    ├── users/
    └── health/

lib/core/
├── errors/                Typed exceptions
├── responses/             JSON envelope
├── pagination/            Paginator + Page
└── utils/                 JWT, BCrypt, RequestId

db/
├── migrate/               ActiveRecord migrations
└── seeds.rb               Idempotent seed data

docs/openapi.yaml          API specification

docker/                    Docker assets
.github/workflows/         CI

spec/                      RSpec test suite
```

---

## 16. Decision log

- **No Rails.** Sinatra is enough for an API; Rails brings unnecessary bloat.
- **ActiveRecord over Sequel.** More familiar to most Ruby developers; the Rails gem ecosystem is a force multiplier.
- **Modular Sinatra via `register`/`use`.** Decouples modules; new features don't require touching the main app.
- **`dry-validation` for contracts.** A typed, Ruby-native equivalent of Zod.
- **Refresh tokens stored as SHA-256.** Industry practice. Plaintext storage is a non-starter.
- **`Sinatra::Base#new`, not `new!`.** The `new!` shortcut bypasses the middleware stack. Always use `new` in `config.ru`.
- **Stateless JWTs.** No Redis dependency. Short TTLs mitigate the inability to revoke.
- **Soft-delete, not hard delete.** Preserves referential integrity and audit history; the `deleted_at` index makes queries cheap.
- **Authorization rules live in services.** Routes should be declarative about *what* they expose, services decide *who* can call them.

---

## 17. Trade-offs and known limitations

- **JWTs cannot be revoked.** Once issued, an access token is valid until expiry. Mitigated by short TTLs (default 1h) and refresh-token rotation.
- **Refresh-token reuse detection is shallow.** We mark tokens revoked but don't walk the chain. Production setups should implement chain revocation.
- **No password recovery flow.** Out of scope. Add a `password_reset_tokens` table and routes when needed.
- **No multi-tenancy.** The `User` model has no `tenant_id`. Add it when you need it.
- **No background jobs.** If you need to send emails or process jobs, add Sidekiq + Redis. The Health module's `checks` hash is the place to wire the Redis check.