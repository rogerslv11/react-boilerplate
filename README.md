# Sinatra Boilerplate

A professional, modular, production-ready backend boilerplate built with **Ruby**, **Sinatra**, and **ActiveRecord**. Designed as a base for REST APIs, SaaS systems, administrative panels, multi-tenant applications, and web backends of any kind.

> No Rails. Sinatra is the only web framework.

---

## Highlights

- **Sinatra 4.x** as the HTTP framework, structured with `Sinatra::Base` modular apps
- **ActiveRecord 8.1** as the ORM (without Rails)
- **PostgreSQL** as the primary database
- **JWT authentication** with access + refresh tokens and rotation
- **dry-validation / dry-schema** for typed input contracts (Zod-equivalent for Ruby)
- **Modular architecture**: each domain is a self-contained module under `app/modules/`
- **Clean separation**: routes, controllers, services, repositories, contracts, serializers, policies
- **Standardized JSON envelope** for success and error responses
- **Centralized error handling** with a hierarchy of typed exceptions
- **Security** built in: BCrypt password hashing, JWT signing with HS256, rate limiting via `rack-attack`, Rack::Protection, CORS, secure request-id propagation
- **Request ID propagation** and structured access logs
- **Health checks** (`/health`, `/health/live`, `/health/ready`)
- **OpenAPI 3.1** documentation at `docs/openapi.yaml`
- **RSpec + FactoryBot + Faker + database_cleaner** for tests
- **Puma** as the application server
- **Docker + docker-compose** for development and production
- **GitHub Actions CI** ready
- **RuboCop** for style and quality enforcement

---

## Requirements

- **Ruby** 3.2 or newer (tested with Ruby 4.0)
- **PostgreSQL** 13 or newer
- **Bundler** 4.x
- **Docker** + **docker-compose** (recommended for local development)

---

## Quick start

```bash
# 1. Clone the repository
git clone <your-repo-url> sinatra-boilerplate
cd sinatra-boilerplate

# 2. Install gems
bundle install

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a long random string
openssl rand -hex 64  # use this to generate JWT_SECRET

# 4. Start PostgreSQL with Docker (easiest)
docker run -d --name sinatra-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sinatra_boilerplate_dev \
  -p 5432:5432 \
  postgres:16-alpine

# 5. Run migrations
bundle exec rake db:migrate

# 6. Seed the database (admin@example.com / admin12345678)
bundle exec rake db:seed

# 7. Start the server
bundle exec puma -C config/puma.rb

# 8. Run the tests
bundle exec rspec
```

The server will be listening on `http://localhost:4567`. Try `curl http://localhost:4567/health` to verify.

---

## Stack

| Concern              | Tool                                  |
| -------------------- | ------------------------------------- |
| HTTP framework       | Sinatra 4.x                           |
| Application server   | Puma                                  |
| Persistence          | ActiveRecord 8.1                      |
| Database             | PostgreSQL 13+                        |
| Validation           | dry-validation / dry-schema           |
| Authentication       | JWT (`jwt` gem) + BCrypt              |
| CORS                 | rack-cors                             |
| Rate limiting        | rack-attack                           |
| HTTP protection      | rack-protection                       |
| Tests                | RSpec, rack-test, factory_bot, faker  |
| Code style           | rubocop, rubocop-rspec                |
| Background jobs      | Redis (optional)                      |
| Documentation        | OpenAPI 3.1 (hand-written)            |
| Containerization     | Docker, docker-compose                |

---

## Project layout

```
.
├── app.rb                       # Main Sinatra application (Sinatra::Base subclass)
├── config.ru                    # Rack entrypoint
├── Rakefile                     # Rake tasks (db:migrate, db:seed, spec, server)
├── Gemfile                      # Dependencies
│
├── config/
│   ├── application.rb           # App bootstrapping + middleware stack
│   ├── database.rb              # ActiveRecord connection
│   ├── environment.rb           # Environment helpers (Env, Log)
│   ├── routes.rb                # Module registry entry point
│   ├── puma.rb                  # Puma server config
│   └── initializers/
│       └── rate_limiting.rb     # Rack::Attack rules
│
├── app/
│   ├── controllers/             # Thin HTTP layer (parse, dispatch, serialize)
│   │   ├── auth_controller.rb
│   │   └── users_controller.rb
│   ├── middleware/              # Custom Rack middleware
│   │   ├── request_id.rb
│   │   ├── access_log.rb
│   │   └── authentication.rb
│   └── modules/                 # Domain modules — one folder per feature
│       ├── auth/
│       │   ├── routes.rb        # Mounts endpoints on the Sinatra app
│       │   ├── service.rb       # Use cases (register, login, refresh)
│       │   ├── refresh_token.rb        # ActiveRecord model
│       │   ├── refresh_token_repository.rb
│       │   └── contracts/auth_contracts.rb
│       ├── users/
│       │   ├── routes.rb
│       │   ├── controller.rb            # (legacy alternative path)
│       │   ├── service.rb
│       │   ├── repository.rb
│       │   ├── model.rb
│       │   ├── contracts/user_contracts.rb
│       │   ├── policies/user_policy.rb
│       │   └── serializers/user_serializer.rb
│       ├── health/
│       │   └── routes.rb
│       └── example/             # Reference module — copy to extend
│           ├── routes.rb
│           └── contracts/example_contract.rb
│
├── lib/                         # Cross-cutting primitives
│   └── core/
│       ├── errors/              # Typed application exceptions
│       ├── responses/           # JSON envelope builders
│       ├── pagination/          # Stable pagination helpers
│       └── utils/                # JWT, BCrypt, request id, logger
│
├── db/
│   ├── migrate/                 # ActiveRecord migrations
│   └── seeds.rb                 # Idempotent seed data
│
├── docs/
│   └── openapi.yaml             # OpenAPI 3.1 specification
│
├── spec/                        # RSpec test suite
│   ├── factories/               # FactoryBot factories
│   ├── support/                 # Helpers, JSON helpers, auth helpers
│   ├── requests/                # HTTP/request specs
│   ├── services/                # Service specs
│   ├── models/                  # Model specs
│   ├── contracts/               # Contract specs
│   └── responses/               # Response builder specs
│
├── docker/
│   └── entrypoint.sh            # Waits for DB, runs migrations, starts app
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── README.md
```

---

## Environment variables

All configuration lives in environment variables. See `.env.example` for the full list.

| Variable                   | Default                       | Notes                                  |
| -------------------------- | ----------------------------- | -------------------------------------- |
| `APP_ENV`                  | `development`                 | `development`, `test`, `production`   |
| `APP_NAME`                 | `sinatra_boilerplate`         | Banner name                            |
| `APP_HOST`                 | `0.0.0.0`                     | Bind address                           |
| `APP_PORT`                 | `4567`                        | Port                                   |
| `DATABASE_HOST`            | `localhost`                   |                                        |
| `DATABASE_PORT`            | `5432`                        |                                        |
| `DATABASE_NAME`            | `sinatra_boilerplate_dev`     |                                        |
| `DATABASE_NAME_TEST`       | `sinatra_boilerplate_test`    |                                        |
| `DATABASE_USER`            | `postgres`                    |                                        |
| `DATABASE_PASSWORD`        | `postgres`                    |                                        |
| `DATABASE_POOL`            | `10`                          |                                        |
| `JWT_SECRET`               | *(required in prod)*          | `openssl rand -hex 64`                 |
| `JWT_ALGORITHM`            | `HS256`                       |                                        |
| `JWT_ACCESS_TTL`           | `3600`                        | Seconds                                 |
| `JWT_REFRESH_TTL`          | `2592000`                     | 30 days                                |
| `JWT_ISIS`               | `sinatra_boilerplate`         |                                        |
| `JWT_AUDIENCE`             | `sinatra_boilerplate_api`     |                                        |
| `CORS_ALLOWED_ORIGINS`     | `*`                           | Comma-separated                        |
| `CORS_ALLOWED_METHODS`     | `GET,POST,...`                |                                        |
| `CORS_ALLOWED_HEADERS`     | `Content-Type,Authorization`  |                                        |
| `RATE_LIMIT`               | `100`                         | Requests per IP per period             |
| `RATE_PERIOD`              | `60`                          | Seconds                                 |
| `LOG_DIR`                  | `./log`                       |                                        |

---

## HTTP API

### Response envelope

All responses follow a consistent envelope.

**Success** (`200`, `201`):
```json
{
  "data": { /* payload */ }
}
```

**Error** (`4xx`, `5xx`):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "email": ["must be a valid email address"] },
    "request_id": "uuid"
  }
}
```

### Health checks

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/`              | Service banner                           |
| GET    | `/health`        | Detailed report including DB check       |
| GET    | `/health/live`   | Liveness probe                           |
| GET    | `/health/ready`  | Readiness probe (verifies DB connection)  |

### Authentication

| Method | Path                        | Auth     | Description                              |
| ------ | --------------------------- | -------- | ---------------------------------------- |
| POST   | `/api/v1/auth/register`     | public   | Register a new user; returns token pair  |
| POST   | `/api/v1/auth/login`        | public   | Login; returns token pair                |
| POST   | `/api/v1/auth/refresh`      | public   | Rotate refresh token; returns new pair   |
| POST   | `/api/v1/auth/logout`       | public   | Revoke a refresh token                   |
| POST   | `/api/v1/auth/logout-all`   | required | Revoke every refresh token for the user  |
| GET    | `/api/v1/auth/me`           | required | Returns the authenticated user           |

### Users

| Method | Path                   | Auth        | Description                              |
| ------ | ---------------------- | ----------- | ---------------------------------------- |
| GET    | `/api/v1/users`        | admin       | List users (paginated, filterable)      |
| POST   | `/api/v1/users`        | admin       | Create a user                            |
| GET    | `/api/v1/users/:id`    | self/admin  | Show a user                              |
| PATCH  | `/api/v1/users/:id`    | self/admin  | Update a user                            |
| DELETE | `/api/v1/users/:id`    | admin       | Soft-delete a user                       |

### Query parameters (list users)

| Parameter  | Type    | Default | Notes                                     |
| ---------- | ------- | ------- | ----------------------------------------- |
| `page`     | integer | 1       |                                           |
| `per_page` | integer | 20      | max 100                                   |
| `q`        | string  | —       | search by name or email                   |
| `role`     | string  | —       | `user` or `admin`                         |
| `active`   | boolean | —       |                                           |
| `sort`     | string  | —       | `name`, `email`, `created_at`, `updated_at`|
| `order`    | string  | —       | `asc` or `desc`                           |

### Example curl session

```bash
BASE=http://localhost:4567

# 1. Register
curl -s -X POST "$BASE/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"alice12345"}'

# 2. Login
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice12345"}' \
  | ruby -rjson -e 'puts JSON.parse($stdin.read).dig("data","access_token")')

# 3. Get the current user
curl -s "$BASE/api/v1/auth/me" -H "Authorization: Bearer $TOKEN"

# 4. List users (admin only)
curl -s "$BASE/api/v1/users" -H "Authorization: Bearer $TOKEN"
```

---

## Authentication strategy and risks

The boilerplate uses a **dual-token** model:

- **Access token**: short-lived JWT (default 1 hour). Sent as `Authorization: Bearer <token>`.
- **Refresh token**: long-lived opaque token (default 30 days). Stored in the database as a SHA-256 hash, never plaintext. Rotated on every refresh.

### Design decisions

- **Plaintext refresh tokens are never persisted.** Only their SHA-256 hash is stored in `refresh_tokens.token_hash`. If the database is leaked, tokens cannot be reused.
- **Refresh token rotation.** Presenting a refresh token issues a new pair and revokes the presented token, so leaked tokens can only be used once.
- **Reuse detection.** A revoked refresh token that is presented again will be rejected (already revoked). Production setups may want to revoke the entire chain on reuse — that is intentionally not done by default; the operation is exposed via `POST /api/v1/auth/logout-all` for manual remediation.
- **JWT signed with HS256.** The secret is loaded from `JWT_SECRET`. Use `openssl rand -hex 64` to generate a strong secret. Rotate the secret regularly; rolling invalidation requires a token blacklist or short TTLs.
- **Tokens carry `jti`.** Logged-out tokens cannot be revoked without a blacklist; rely on short `JWT_ACCESS_TTL` for revocation.
- **Password hashing.** BCrypt with cost 12 (configurable via `BCRYPT_COST`). Passwords are validated against their hash via constant-time comparison.
- **Authorization rules** are centralized in the service (`authorize_read!`, `authorize_update!`, `authorize_delete!`, `authorize_create!`).

### Known risks and trade-offs

- **JWT cannot be revoked** without an external store (Redis blacklist). Rely on short TTLs.
- **No refresh-token chain detection.** Detecting reuse requires storing the `replaced_by` column (already present) and walking the chain — implemented as a stub. Production setups should enable chain revocation.
- **No password recovery flow.** Intentionally out of scope; copy the `Auth` module and add `password_reset_tokens` to implement.

---

## Authorization model

- **Self-management**: every authenticated user can read and update their own profile (excluding `role` and `active`).
- **Admin-only**: listing all users, creating users, deleting users, changing `role`, deactivating accounts.
- **Soft-delete**: the `deleted_at` column is set on `DELETE`. Soft-deleted users cannot authenticate.
- **Conflict detection on email**: the unique index uses `LOWER(email)` for case-insensitive uniqueness.

---

## Validation with dry-validation

We use `dry-validation` for typed input validation. Each module exposes its own contracts under `contracts/`. Contracts are independent of ActiveRecord, so model rules and request rules don't have to be duplicated.

Example contract:

```ruby
class CreateContract < Dry::Validation::Contract
  params do
    required(:name).filled(:string, max_size?: 120)
    required(:email).filled(:string, max_size?: 180)
    required(:password).filled(:string, min_size?: 8, max_size?: 128)
    optional(:role).filled(:string, included_in?: %w[user admin])
  end

  rule(:email) do
    key.failure('must be a valid email address') unless
      value.match?(/\A[^@\s]+@[^@\s]+\.[^@\s]+\z/)
  end

  rule(:password) do
    key.failure('must contain at least one letter and one number') unless
      value.match?(/\A(?=.*[A-Za-z])(?=.*\d)/)
  end
end
```

A failed contract raises `Errors::ValidationError`, which is caught by the centralized error handler and returned as `422` with `code: VALIDATION_ERROR` and per-field details.

---

## Security

| Concern                | Implementation                                                |
| ---------------------- | ------------------------------------------------------------- |
| Password storage       | BCrypt cost 12 (configurable)                                 |
| Token signing          | HS256 with `JWT_SECRET`                                       |
| Token storage          | Refresh tokens stored as SHA-256 hash, never plaintext       |
| Rate limiting          | `rack-attack` with per-IP and per-login throttles             |
| CORS                   | `rack-cors` with configurable origins, methods, headers       |
| HTTP protections       | `rack-protection` (frame options, JSON CSRF, path traversal)  |
| SQL injection          | All queries go through ActiveRecord parameterized queries    |
| Sensitive data         | Never serialized (`password_digest` not in any response)      |
| Stack traces           | Hidden in production (`Sinatra::Env.production?`)            |
| Request ID             | Generated/extracted on every request, returned in headers     |
| Logs                   | Structured JSON; secrets/tokens never logged                  |
| CORS credentials       | CORS allows configurable `Authorization` header                |
| CSRF                   | `Rack::Protection::JsonCsrf` active for non-XHR JSON requests |

**Out of scope by default:**
- Server-side cookies (stateless API).
- Session-based authentication.

---

## Logging and observability

- Every request gets a unique `X-Request-Id` (UUID v4) header. The id is propagated through the Rack environment and back to the client.
- Access logs are emitted by the `AccessLog` middleware with structured JSON fields: `method`, `path`, `status`, `duration_ms`, `request_id`, `ip`.
- Unhandled exceptions are logged with backtraces (truncated).
- Production logs do not include sensitive data — passwords and tokens are never logged.
- `/health` reports the database check, environment, version, and uptime.

---

## Adding a new module

1. Create the module folder: `app/modules/<name>/`
2. Add the following files (the minimum useful surface):
   ```
   app/modules/<name>/
   ├── routes.rb
   ├── service.rb           # Use cases
   ├── repository.rb        # Persistence queries (optional)
   ├── model.rb             # ActiveRecord model (optional)
   └── contracts/
       └── <name>_contracts.rb
   ```
3. Wire the routes in `config/routes.rb`:
   ```ruby
   require_relative '../app/modules/<name>/routes'
   SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::<Name>::Routes)
   ```
4. Create a migration in `db/migrate/` if you added a model.
5. Add tests under `spec/requests/<name>/`.

The `Example` module is a complete, minimal reference implementation.

---

## Running tests

```bash
# All tests
bundle exec rspec

# Single file
bundle exec rspec spec/requests/auth/auth_spec.rb

# By tag
bundle exec rspec --tag focus
```

Tests use:
- `Rack::Test` for HTTP integration
- `FactoryBot` for fixtures
- `Faker` for fake data
- `DatabaseCleaner` for test isolation (truncation strategy)
- A separate PostgreSQL database (`sinatra_boilerplate_test`)

The test database is auto-migrated on the first run; ensure `DATABASE_NAME_TEST` is reachable.

---

## Docker

### Development

```bash
docker compose up
```

This starts PostgreSQL and the Sinatra app together. The app listens on `http://localhost:4567`. The `app` service mounts the source as a volume for live reloads.

### Production

```bash
docker build --target prod -t sinatra-boilerplate:prod .
docker run -d \
  -p 4567:4567 \
  -e APP_ENV=production \
  -e JWT_SECRET=$(openssl rand -hex 64) \
  -e DATABASE_HOST=db.example.com \
  -e DATABASE_NAME=sinatra_boilerplate \
  -e DATABASE_USER=app \
  -e DATABASE_PASSWORD=secret \
  --name sinatra-boilerplate \
  sinatra-boilerplate:prod
```

### Tests in Docker

```bash
docker build --target test -t sinatra-boilerplate:test .
docker run --rm --network host \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e APP_ENV=test \
  sinatra-boilerplate:test
```

---

## CI

GitHub Actions configuration is provided at `.github/workflows/ci.yml`. It:
1. Sets up Ruby 3.3
2. Spins up PostgreSQL
4. Runs `bundle exec rake db:migrate`
5. Runs `bundle exec rspec`
6. Runs `bundle exec rubocop`
7. Builds the Docker image

---

## OpenAPI

The full OpenAPI 3.1 specification lives at `docs/openapi.yaml`. You can render it with any tool, e.g.:

```bash
npx @redocly/cli preview-docs docs/openapi.yaml
```

Or use Swagger UI:

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/openapi.yaml \
  -v $PWD/docs:/api \
  swaggerapi/swagger-ui
```

---

## Scripts reference

```bash
# Run migrations
bundle exec rake db:migrate

# Seed the database
bundle exec rake db:seed

# Drop and recreate everything
bundle exec rake db:reset

# Run the server
bundle exec puma -C config/puma.rb

# Run all tests
bundle exec rspec

# Run linter
bundle exec rubocop
bundle exec rubocop -A  # autocorrect
```

---

## Architectural decisions

- **No Rails.** Sinatra is enough for an API server; bringing Rails would add a lot of overhead and bloat.
- **ActiveRecord over Sequel.** Wider ecosystem, more familiar to most Ruby developers, well-supported.
- **Modular Sinatra via `register`/`use`.** Each module exposes a `self.registered(app)` hook that registers routes on the main app. This keeps modules decoupled and easy to add/remove.
- **Repository + Service + Controller.** Controllers are thin. Services own business logic and authorization. Repositories encapsulate queries.
- **Contracts in `dry-validation`** keep validation logic separate from models and HTTP layers, which makes them reusable.
- **SHA-256 hashed refresh tokens.** Industry standard; if the database is compromised, tokens can't be replayed.
- **Stateless JWT.** Access tokens are signed and verifiable by any instance without consulting a session store. The trade-off is revocation: rely on short TTLs.
- **`Sinatra::Base#new`, not `new!`.** The `new!` method returns an instance **without** the middleware stack. Use `new` in `config.ru`.
- **Structured logs over free-form.** Easier to ship to log aggregation systems.

---

## License

MIT. See `LICENSE` if present, or use freely.

---

## Contributing

Pull requests welcome. Run `bundle exec rspec && bundle exec rubocop` before submitting.