# Arquitetura — NestJS Backend Boilerplate

> Documento de arquitetura: objetivos, decisões, camadas, fluxos e limites do boilerplate.

---

## 1. Propósito

Fornecer uma base profissional, opinativa e enxuta para APIs REST em **Node.js + NestJS**, com:

- Validação de entrada inteiramente em **Zod** (sem DTOs tradicionais com `@IsString`).
- Acesso a dados tipado via **Prisma** + PostgreSQL.
- Autenticação **JWT** (Argon2 + refresh tokens com rotação).
- Documentação **OpenAPI/Swagger** gerada a partir dos mesmos schemas Zod.
- Tratamento global de erros, request-id de correlação, logging estruturado (Pino),
  rate limiting, helmet, CORS e compressão — sem dependências desnecessárias.

A ideia é **Clean Architecture pragmática**: os módulos de negócio não conhecem o
Prisma diretamente, usam *interfaces/contratos* apenas quando há inversão real
de dependência e mantêm a fonte da verdade em **schemas Zod** (entrada) e
**entidades Prisma** (persistência).

---

## 2. Stack e versões estáveis

| Camada                     | Tecnologia                       | Por quê                                             |
|----------------------------|----------------------------------|-----------------------------------------------------|
| Runtime                    | Node.js LTS (20+)                | Suporte de longo prazo e compatibilidade do Nest    |
| Framework                  | NestJS 11                        | Decorators, IoC, modularização, padrão de mercado  |
| Linguagem                  | TypeScript 5.7+ (strict)         | Tipagem forte em todo o código                      |
| Validação                  | Zod 3.25+                        | Schemas como *source of truth* para input/contratos |
| ORM                        | Prisma 6                         | Tipos gerados, migrations, transações              |
| Banco                      | PostgreSQL 16                    | Maduro, performático, open-source                   |
| Hash de senha              | Argon2 (argon2id)                | Resistência a GPU/ASIC, padrão OWASP                |
| Autenticação               | JWT (HS256) + Passport           | Stateless, interoperável                            |
| Documentação               | @nestjs/swagger + zod-to-json-schema | OpenAPI derivado direto dos schemas            |
| Logging                    | nestjs-pino + pino               | Logs estruturados em JSON (LTS-ready)               |
| Segurança HTTP             | helmet                           | Headers de segurança best-practice                  |
| Rate limit                 | @nestjs/throttler                | Proteção contra abuso por padrão                    |
| Compressão                 | compression                      | Resposta menor para clientes                        |
| Testes                     | vitest 3                         | Rápido, compatível com ESM e TS nativo              |
| Qualidade                  | ESLint 9 (flat config) + Prettier | Estilo uniforme, sem `any`, sem `unused`           |

**Decisão deliberada:** evitamos NestJS-Zod e `@asteasolutions/zod-to-openapi`
porque estamos comprometidos com schemas Zod como única fonte e queremos
decorators enxutos (`@Body(new ZodValidationPipe(Schema))`), evitando DTOs
gerados a partir de schemas.

---

## 3. Princípios arquiteturais

1. **Schemas Zod são a fonte da verdade para entradas.**
   Cada endpoint declara um schema e o `ZodValidationPipe` valida e converte
   *no limite*. Nada de `@IsEmail()`, nada de classes DTO.

2. **Sem abstrações vazias.**
   Não criamos `IUsersService`, `BaseRepository<T>` ou outras camadas que
   apenas reproduzam o Prisma. Quando uma interface é genuinamente útil
   (ex.: estratégia de hashing, *strategy* de auth), ela existe; caso
   contrário, optamos por funções/módulos simples.

3. **Clean Architecture pragmática, sem fanatismo.**
   Camadas: `controller → service → repository → prisma`. Os serviços contêm
   as regras de negócio; os *repositories* isolam as queries Prisma.

4. **Erros são valores.**
   Exceções de domínio herdam de `DomainException` carregando `status`,
   `code` e `message` consistentes. O filtro global converte tudo num
   envelope JSON padronizado.

5. **Logs estruturados em todas as camadas.**
   `nestjs-pino` produz JSON com `requestId`, `level`, `context`, prontos
   para ingest em ferramentas como Loki/Datadog.

6. **Config validada antes do `app.listen`.**
   O `EnvSchema` (Zod) é executado em `main.ts` *antes* do `NestFactory`.
   Falha de configuração → processo aborta com mensagem clara.

---

## 4. Estrutura de diretórios

```
nestjs-boilerplate/
├── prisma/
│   ├── schema.prisma            # Schema do banco
│   └── seed.ts                  # Seed inicial (admin/user)
│
├── src/
│   ├── main.ts                  # Bootstrap (env, helmet, cors, prefix, swagger)
│   ├── app.module.ts            # Raiz: ConfigModule + LoggerModule + Throttler + feature modules
│   │
│   ├── config/                  # Configurações tipadas e registradas no @nestjs/config
│   │   ├── env.schema.ts        # Zod schema das variáveis de ambiente
│   │   ├── app.config.ts        # api prefix, cors, host/port
│   │   ├── auth.config.ts       # JWT secrets/expirations
│   │   ├── database.config.ts   # DATABASE_URL, log level, pool size
│   │   ├── swagger.config.ts    # Enabled, path, title; throttle; log
│   │   ├── configuration.ts     # Imports agrupados
│   │   └── index.ts             # Re-exports nomeados
│   │
│   ├── shared/                  # Tipos e constantes compartilhados por toda a app
│   │   ├── constants.ts
│   │   └── types.ts             # ApiResponse, ApiErrorResponse, PaginatedResult
│   │
│   ├── common/                  # Utilitários "transversais" (cross-cutting)
│   │   ├── exceptions/          # DomainException, ConflictException, NotFoundException…
│   │   ├── filters/             # GlobalExceptionFilter → envelope de erro único
│   │   ├── interceptors/        # ResponseInterceptor → envelope de sucesso único
│   │   ├── pipes/               # ZodValidationPipe
│   │   ├── decorators/          # @Roles, @CurrentUser, @RequestId + helpers Zod→Swagger
│   │   └── utils/               # request-id, schemas Zod comuns (pagination, password…)
│   │
│   ├── infrastructure/          # Detalhes técnicos isolados (Prisma, etc.)
│   │   └── database/
│   │       ├── prisma.module.ts # @Global() — expõe PrismaService
│   │       └── prisma.service.ts# Lifecycle, pingCheck helpers, log levels
│   │
│   └── modules/                 # Domínio (cada módulo é self-contained)
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts          # register / login / refresh / logout / me
│       │   ├── auth.schemas.ts         # Zod: Login, Register, Refresh, TokenResponse
│       │   ├── jwt.strategy.ts         # Passport JWT strategy
│       │   ├── jwt-auth.guard.ts       # @UseGuards(JwtAuthGuard)
│       │   ├── roles.guard.ts          # @UseGuards(RolesGuard) + @Roles(...)
│       │   └── types.ts                # JwtPayload re-export
│       │
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts     # CRUD + /me + change password
│       │   ├── users.service.ts        # Regras: hash, unique email, password change
│       │   ├── users.repository.ts     # Queries Prisma (findByEmail, list paginado…)
│       │   ├── users.schemas.ts        # Zod: Create/Update/ChangePassword/List/Pagination
│       │   ├── services/index.ts
│       │   ├── repositories/index.ts
│       │   ├── schemas/index.ts
│       │   └── types/user.types.ts     # AuthenticatedUser, UserWithPassword
│       │
│       └── health/
│           ├── health.module.ts        # Terminus (DB ping, liveness, readiness)
│           └── health.controller.ts
│
├── test/
│   └── unit/                    # Vitest — schemas, pipes e service (mocks)
│
├── docs/
│   ├── architecture.md          # ← este documento
│   ├── development.md           # Comandos do dia-a-dia
│   └── deployment.md            # Deploy (Docker, CI, env vars)
│
├── Dockerfile                   # multi-stage, non-root, tini, healthcheck
├── docker-compose.yml           # api + postgres
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
├── eslint.config.mjs
├── .prettierrc
├── .dockerignore
├── .env.example
└── README.md
```

> A estrutura foi podada para evitar pastas com 1 arquivo só. Quando um módulo
> tem um único arquivo (ex.: `auth/types.ts`), ele mora direto no diretório
> do módulo.

---

## 5. Camadas e fluxo de uma requisição

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Cliente                                                                 │
│   curl /api/v1/users                                                     │
└────────┬─────────────────────────────────────────────────────────────────┘
         │ 1) HTTP request
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Bootstrap (main.ts)                                                      │
│   • EnvSchema.safeParse(process.env) → fail-fast                         │
│   • Helmet, compression, cookieParser                                     │
│   • CORS                                                                 │
│   • setGlobalPrefix('api') + VersioningType.URI ('v1')                   │
│   • Request-id propagation (x-request-id → log → response)                │
│   • /docs (Swagger UI), /docs-json                                        │
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Pipes / Guards                                                           │
│   1) ZodValidationPipe(schema)  — valida body/query/params               │
│   2) JwtAuthGuard               — valida Bearer token                    │
│   3) ThrottlerGuard             — limite de requests/min                 │
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Controller                                                               │
│   Recebe `body`, `query`, `params` tipados via `z.infer<typeof schema>`. │
│   Delega a um service. Sem `if`s com regra de negócio.                   │
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Service                                                                  │
│   Aplica regras (hash de senha, checagem de unique, validações cruzadas).│
│   Lança `ConflictException`, `NotFoundException`, `UnauthorizedException`.│
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Repository                                                               │
│   Queries Prisma estreitas (findByEmail, list paginado, etc.).           │
│   Recebe apenas o que precisa.                                           │
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PrismaService                                                            │
│   `@Global()` PrismaClient. Lifecycle: $connect onModuleInit,            │
│   $disconnect onApplicationShutdown.                                     │
└────────┬─────────────────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PostgreSQL                                                               │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼ (resposta sobe de volta)
┌──────────────────────────────────────────────────────────────────────────┐
│ ResponseInterceptor                                                      │
│   Envelopa resultado em:                                                 │
│     { success, statusCode, data, timestamp, requestId }                  │
└────────┬─────────────────────────────────────────────────────────────────┘
         │ 2) HTTP response
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Cliente                                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Erros** são capturados pelo **`GlobalExceptionFilter`** a qualquer momento.
Ele normaliza Prisma (`P2002`, `P2025`, …), Zod, `HttpException`, `DomainException`
e *erros não tratados* num envelope único:

```json
{
  "success": false,
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "Email already registered",
  "code": "CONFLICT",
  "errors": [{ "field": "email", "message": "Email already registered", "code": "CONFLICT" }],
  "path": "/api/v1/users",
  "timestamp": "2026-09-21T18:00:00.000Z",
  "requestId": "uuid"
}
```

---

## 6. Validação com Zod (sem DTOs)

Cada módulo declara seus schemas num arquivo `*.schemas.ts`. As regras comuns
moram em `src/common/utils/zod-schemas.ts` (`emailSchema`, `passwordSchema`,
`nameSchema`, `PaginationSchema`).

Exemplo (Users):

```typescript
// users.schemas.ts
import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { PaginationSchema, atLeastOne, emailSchema, nameSchema, passwordSchema } from '@/common/utils/zod-schemas';

const userRoleEnum = z.enum([UserRole.ADMIN, UserRole.USER]);

export const CreateUserSchema = z.object({
  name: nameSchema('Name', 100),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleEnum.default(UserRole.USER),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

E o controller valida no ponto de entrada:

```typescript
@Post()
async create(
  @Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserInput,
) {
  return this.usersService.create(body);
}
```

> **Por que ZodValidationPipe explícito por parâmetro?**
> Em vez de um pipe global mágico, declaramos o schema *onde* ele é usado.
> O compilador infere o tipo, o Swagger deriva o contrato, e o teste de
> schema Zod fica trivial.

### Zod → Swagger

Os decorators `@ApiZodBody`/`@ApiZodQuery`/`@ApiZodResponse` convertem
schemas Zod para JSON Schema via `zod-to-json-schema` e atribuem a
`@nestjs/swagger`. O resultado: a especificação OpenAPI em `/docs-json`
**reflete os mesmos schemas** dos endpoints.

---

## 7. Autenticação e autorização

### Fluxo

```
register ─┐
login ────┼─► usersService.create / findRawByEmail
          │      └─► argon2.hash / argon2.verify
          │
          ▼
   issueTokens(claims)
   ├── jwt.signAsync(access)    ── JWT HS256, 15m default
   └── refreshToken.create      ── hash (sha256) + expiração 7d default

Cada request autenticado:
   JwtAuthGuard ─► passport-jwt extrai Bearer ─► JwtStrategy.validate(payload)
   ─► request.user = { sub, email, role }
```

### Refresh token com rotação

1. Cliente envia `refreshToken` em `/auth/refresh`.
2. Backend faz `sha256(token)`, busca no banco, e **revoga** o anterior.
3. Emite novo par (`accessToken` + `refreshToken`) e persiste o novo hash.
4. Tentar reusar um token revogado/expirado → 401 genérico
   (`"Invalid refresh token"`).

### Roles

```typescript
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
```

`RolesGuard` lê metadata via `Reflector` e checa `user.role`. Forbids são
respondidos com `403` e `code: "FORBIDDEN"`.

### Senhas

- Hash com **Argon2id**, parâmetros `memoryCost=2^16`, `timeCost=3`,
  `parallelism=1`. Adequado a produção; ajustável via `package.json`.
- Política de senha (em `passwordSchema`): ≥8 chars, ≤72 (limite do argon2),
  ao menos uma maiúscula, uma minúscula, um dígito.

---

## 8. Banco de dados e migrations

### Prisma Service

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit()          { await this.$connect(); }
  async onApplicationShutdown() { await this.$disconnect(); }
}
```

- `PrismaModule` é `@Global()`. Qualquer controller/service injeta
  `PrismaService` sem precisar importar o módulo.
- Log level configurável via `DATABASE_LOG_LEVEL` (default `warn`).
- `PrismaClient` gerado para `node_modules/.prisma/client` (default),
  tipagem via `@prisma/client`.

### Comandos

```bash
# dev
npx prisma migrate dev
npx prisma studio
npm run prisma:seed

# prod
npx prisma migrate deploy
```

> Importante: `prisma migrate dev` mexe no schema. Em produção use
> **`prisma migrate deploy`**, que aplica migrations existentes sem alterar
> estado.

### Paginação

`PaginationSchema` (em `common/utils/zod-schemas.ts`):

```ts
{ page: preprocessed number (default 1),
  pageSize: preprocessed number (default 20, max 100),
  sortBy: string opcional,
  sortOrder: 'asc' | 'desc' default 'asc',
  search: string opcional }
```

`UsersRepository.list` usa `skip`+`take` dentro de uma `$transaction`
(findMany + count) para resultados consistentes.

---

## 9. Erros, respostas e request-id

### Envelope de sucesso

```json
{
  "success": true,
  "statusCode": 201,
  "data": { "id": "uuid", "email": "alice@example.com", … },
  "timestamp": "ISO-8601",
  "requestId": "uuid"
}
```

### Envelope de erro

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "password", "message": "Password must contain at least 8 characters", "code": "too_small" }
  ],
  "path": "/api/v1/auth/register",
  "timestamp": "ISO-8601",
  "requestId": "uuid"
}
```

### Request ID

Todo request recebe um `X-Request-Id`. Se o cliente envia um, é respeitado;
caso contrário, geramos um UUID v4. Ele aparece:

- no response header (`X-Request-Id`),
- em todo log (campo `requestId`, via `nestjs-pino`),
- no body de resposta (sucesso e erro).

Para correlacionar logs: `grep "<requestId>"`.

### Status 204

`ResponseInterceptor` deixa `204 No Content` passar com body vazio.

---

## 10. Logging, segurança e middleware

| Middleware          | Por quê                                                |
|---------------------|--------------------------------------------------------|
| `helmet`            | HSTS, frameguard, XSS, MIME-type nosniff, etc.        |
| `compression`       | Resposta menor para clientes HTTP                     |
| `cookie-parser`     | Suporte a cookies (refresh tokens em cookie, opcional) |
| CORS                | Origem configurável via `CORS_ORIGIN` (csv ou `*`)    |
| `ThrottlerGuard`    | 120 req/min por IP (default)                          |
| `nestjs-pino` + redactor | Logs JSON; mascara `password`, `Authorization`  |

**Pino redact** apaga campos sensíveis antes de logar:

- `req.headers.authorization`
- `req.headers.cookie`
- `req.body.password`, `req.body.currentPassword`, `req.body.newPassword`

---

## 11. Configuração e env

Toda configuração vai via `process.env` e é validada em `main.ts` por
`EnvSchema`:

```
NODE_ENV, APP_NAME, PORT, HOST,
API_PREFIX, API_VERSION, CORS_ORIGIN, CORS_CREDENTIALS,
DATABASE_URL, DATABASE_LOG_LEVEL, DATABASE_POOL_SIZE,
LOG_LEVEL, LOG_PRETTY,
THROTTLE_TTL, THROTTLE_LIMIT,
JWT_SECRET (≥32), JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN,
SWAGGER_ENABLED, SWAGGER_PATH, SWAGGER_TITLE, SWAGGER_DESCRIPTION, SWAGGER_VERSION
```

> **Fail fast.** Se faltar `JWT_SECRET` ou `DATABASE_URL`, a aplicação
> **não inicia**. Falha clara é melhor que crash em runtime.

---

## 12. Endpoints atuais

| Method | Path                                | Auth   | Descrição                              |
|--------|-------------------------------------|--------|----------------------------------------|
| GET    | `/api/v1/health/liveness`           | -      | Sobe uptime e timestamp                |
| GET    | `/api/v1/health/readiness`          | -      | Ping no Postgres via Terminus          |
| GET    | `/api/v1/health`                    | -      | Ping completo (Prisma)                 |
| POST   | `/api/v1/auth/register`             | -      | Cria usuário e devolve tokens          |
| POST   | `/api/v1/auth/login`                | -      | Login + tokens                         |
| POST   | `/api/v1/auth/refresh`              | -      | Rotação de refresh                     |
| POST   | `/api/v1/auth/logout`               | -      | Revoga refresh                         |
| GET    | `/api/v1/auth/me`                   | Bearer | Perfil do autenticado                  |
| POST   | `/api/v1/users`                     | Admin  | Cria usuário                           |
| GET    | `/api/v1/users`                     | Admin  | Lista paginada                         |
| GET    | `/api/v1/users/me`                  | Bearer | Mesmo que `/auth/me`                   |
| GET    | `/api/v1/users/:id`                 | Bearer | Detalhe                                |
| PATCH  | `/api/v1/users/:id`                 | Bearer | Atualização parcial                    |
| PATCH  | `/api/v1/users/:id/password`        | Bearer | Troca de senha                         |
| DELETE | `/api/v1/users/:id`                 | Admin  | Remove usuário                         |
| GET    | `/docs`                             | -      | Swagger UI                             |
| GET    | `/docs-json`                        | -      | OpenAPI em JSON                        |

---

## 13. Critérios de aceitação — verificados

- [x] Aplicação inicia (NestFactory → Prisma connect → listen)
- [x] PostgreSQL via Docker funcionou (DOCKER compose file)
- [x] Prisma conecta (`Prisma connected to the database`)
- [x] `prisma migrate dev` cria a migration e gera o client
- [x] Schemas Zod validam `body`/`query`/`params`
- [x] API **não depende** de DTOs tradicionais; `@Body(new ZodValidationPipe(Schema))`
- [x] Swagger deriva contratos de schemas Zod (`zod-to-json-schema`)
- [x] Cadastro + Login + Refresh funcionam contra Postgres real
- [x] Endpoints privados exigem `Authorization: Bearer …`
- [x] CRUD de `users` persiste no banco (Prisma)
- [x] Erros padronizados em um único envelope (`GlobalExceptionFilter`)
- [x] `vitest run` passa 36/36 testes
- [x] `npx nest build` produz `dist/src/main.js`
- [x] `npx eslint` passa sem erros

---

## 14. Como adicionar um novo módulo

1. **Schemas** — `src/modules/<m>/schemas/<m>.schemas.ts` com Zod
   (input/output/PaginationSchema se for lista).
2. **Repository** — `src/modules/<m>/repositories/<m>.repository.ts`
   com `@Injectable()` + `PrismaService`. Não exponha o `User`-shaped Prisma
   cru para o service se ele não precisa.
3. **Service** — `src/modules/<m>/services/<m>.service.ts`. Regras de
   negócio, exceções de domínio, hashing.
4. **Controller** — `src/modules/<m>/<m>.controller.ts`
   com `@ApiTags`, `@ApiOperation`, `@ApiZodBody/Query/Response`,
   `@UseGuards` quando aplicável.
5. **Module** — `src/modules/<m>/<m>.module.ts` agrega tudo.
6. **Wire em `app.module.ts`.**
7. **Adicione testes** — `test/unit/<m>.schemas.spec.ts` cobre validação;
   se necessário, `<m>.service.spec.ts` cobre regras.

---

## 15. Limites e pendências

- **Sem rate-limit por usuário, apenas por IP.** Para ambientes com NAT,
  considerar token buckets por `user.sub`.
- **Sentry/OTel não foram integrados.** Estrutura de logging está pronta:
  basta plugar um `transport` no Pino.
- **Filas, cache e Redis** foram propositalmente **deixados de fora**.
  Quando precisar, o módulo de infra já está pronto para receber
  `bullmq` + `ioredis`.
- **JWT usa HS256.** Para serviços distribuídos (múltiplos backends),
  migrar para RS256/EdDSA e hospedar chaves públicas (JWKS).
- **Sem login social.** Adicionar providers Passport (`passport-google`,
  etc.) é trivial seguindo o padrão do `JwtStrategy`.
- **Sem refresh tokens em cookie HttpOnly.** A versão atual envia refresh
  em body; mover para cookie com flag `secure`/`httpOnly` é um passo de
  hardening recomendado antes de produção.

> **O boilerplate é uma base segura para desenvolvimento, NÃO para
> produção sem revisão.** Ajuste TLS, rotação de secrets, escopo de
> CORS, política de senha, parâmetros de Argon2, e remova a
> `cookieParser`/CORS permissivo conforme o ambiente alvo.
