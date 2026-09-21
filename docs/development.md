# Development Guide

Comandos do dia-a-dia para trabalhar no boilerplate.

---

## Pré-requisitos

- Node.js 20+ LTS
- npm 10+
- Docker + Docker Compose (para Postgres)
- Uma cópia de `.env` (crie a partir de `.env.example`)

---

## Setup local

```bash
git clone …
cd nestjs-boilerplate

cp .env.example .env
# Edite JWT_SECRET e JWT_REFRESH_SECRET (32+ bytes cada).
openssl rand -base64 48      # para JWT_SECRET

npm install
docker compose up -d postgres

npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

A API sobe em `http://localhost:3000/api/v1`.

---

## Scripts úteis

| Comando                          | O que faz                                  |
|----------------------------------|--------------------------------------------|
| `npm run start:dev`              | Nest em watch mode (reinicia ao salvar)     |
| `npm run start:debug`            | Watch + Node --inspect                     |
| `npm run build`                  | Build TypeScript (gera `dist/src/main.js`)  |
| `npm run start:prod`             | Roda o build (use `node dist/src/main.js`) |
| `npm run lint`                   | ESLint                                     |
| `npm run format`                 | Prettier                                   |
| `npm run typecheck`              | TypeScript sem emitir                      |
| `npm test`                       | Vitest (todos os specs)                    |
| `npm run test:cov`               | Vitest com cobertura                       |
| `npm run prisma:generate`        | Gera o cliente                             |
| `npm run prisma:migrate:dev`     | Cria/aplica migrations em dev              |
| `npm run prisma:migrate:deploy`  | Aplica migrations em prod                  |
| `npm run prisma:studio`          | GUI do banco                               |
| `npm run prisma:seed`            | Popula usuários iniciais                   |

---

## Workflow ao adicionar um endpoint

1. Declare o schema Zod em `src/modules/<m>/schemas/<m>.schemas.ts`.
   Inclua `CreateX`, `UpdateX`, `ListXQuerySchema`, e (se útil) o output
   `XResponseSchema` para reaproveitar no Swagger.
2. Atualize `repository` com queries Prisma específicas.
3. Implemente a regra de negócio em `service`; lance exceções de
   `common/exceptions`.
4. Adicione a rota em `controller` com `@Body(new ZodValidationPipe(Schema))`
   e decorators Zod→Swagger (`@ApiZodBody`, `@ApiZodQuery`,
   `@ApiZodResponse`).
5. Escreva testes:
   - Schemas: `test/unit/<m>.schemas.spec.ts`.
   - Service (regras): `test/unit/<m>.service.spec.ts` com mocks de
     `PrismaService` e do `Repository` quando aplicável.
6. Verifique `npm run lint && npm run typecheck && npm test`.

---

## Variáveis de ambiente

Veja `.env.example`. Resumo das obrigatórias:

- `DATABASE_URL` — string Postgres (`postgresql://…`)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — mínimo 32 caracteres
- `NODE_ENV` — `development | test | staging | production`

Aplicação aborta com erro legível se algo estiver faltando.

---

## Debug

`npm run start:debug` ativa Node `--inspect`. Anexe o debugger da sua IDE em
`localhost:9229` (o padrão).

Para logar explicitamente:

```typescript
import { Logger } from 'nestjs-pino';

@Injectable()
export class FooService {
  private readonly logger = new Logger(FooService.name);
  this.logger.log('mensagem');
}
```

---

## Testes

- **Unit** — `test/unit/*.spec.ts`. Foco em schemas Zod e service usando
  repositórios stub.
- **Integração (opcional)** — se quiser, aponte
  `INTEGRATION_DATABASE_URL` para uma base de teste real e crie specs
  em `test/integration/`.
- **E2E (opcional)** — boot completo via `supertest`, configurando
  in-memory repositories para evitar dependência de banco.

Para rodar uma única spec:

```bash
npx vitest run test/unit/users.schemas.spec.ts
```

---

## Dicas Prisma

- Após alterar `schema.prisma`: `npm run prisma:migrate:dev`.
- Para inspecionar dados: `npm run prisma:studio`.
- Em produção use SEMPRE `npm run prisma:migrate:deploy`.
- Evite `prisma migrate dev` em pipelines de produção — ele cria migrations.

---

## Convenções

- Sem `any` (ESLint bloqueia).
- Sem DTOs tradicionais. Apenas schemas Zod + `@Body(new ZodValidationPipe(Schema))`.
- Controllers finos: nenhuma regra de negócio no controller.
- Services nunca injetam `Controller`. Services injetam `Repository`.
- Mensagens de erro **sem detalhes internos em produção** (filtro já faz isso).

Para detalhes sobre arquitetura, ver `docs/architecture.md`.
