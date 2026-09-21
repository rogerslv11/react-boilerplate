# Deployment Guide

Como colocar a aplicação em produção.

---

## 1. Build local

```bash
npm install --omit=dev
npm run prisma:generate
npm run build
```

Saída: `dist/src/main.js`. Para rodar:

```bash
DATABASE_URL=… \
JWT_SECRET=… \
JWT_REFRESH_SECRET=… \
NODE_ENV=production \
PORT=3000 \
LOG_PRETTY=false \
node dist/src/main.js
```

---

## 2. Docker

A imagem é **multi-stage** em `Dockerfile` (Node 22 LTS + tini + usuário
não-root). Build:

```bash
docker build -t nestjs-boilerplate:1.0.0 .
```

`docker-compose.yml` traz:

- `api` — aplicação NestJS
- `postgres` — banco com volume persistente
- Healthchecks em ambos os serviços
- Dependência `depends_on: condition: service_healthy`

```bash
docker compose up -d --build
docker compose logs -f api
```

> O **Postgres não deve ser exposto publicamente** em produção. Em
> `docker-compose.yml` ele publica a porta `5432` apenas por conveniência
> local — remova isso (`ports:`) para o ambiente real.

---

## 3. Migrate em produção

Use **sempre** `prisma migrate deploy`, que apenas aplica migrations
existentes (e é idempotente):

```bash
# Em CI/CD, dentro de um container com DATABASE_URL apontando para o RDS/Db:
npx prisma migrate deploy
```

> **Nunca** rode `prisma migrate dev` em produção. Ele cria migrations
> e mexe no schema.

### Estratégia recomendada

1. CI: roda `prisma migrate deploy` antes de subir a nova imagem.
2. App inicia e verifica `$connect()` no `onModuleInit`.
3. Rollback automático se o health check não passa em N segundos.

---

## 4. Variáveis de ambiente obrigatórias em produção

```
NODE_ENV=production
PORT=3000
API_PREFIX=api
API_VERSION=v1
CORS_ORIGIN=https://app.example.com
DATABASE_URL=postgresql://user:pass@db.internal:5432/app_db?schema=public
DATABASE_LOG_LEVEL=warn
DATABASE_POOL_SIZE=20
LOG_LEVEL=info
LOG_PRETTY=false
THROTTLE_TTL=60
THROTTLE_LIMIT=240

JWT_SECRET=<openssl rand -base64 48>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<openssl rand -base64 48>
JWT_REFRESH_EXPIRES_IN=7d

SWAGGER_ENABLED=false
SWAGGER_TITLE=NestJS Boilerplate
```

> `SWAGGER_ENABLED=false` em produção — não exponha `/docs` publicamente
> a menos que esteja atrás de autenticação.

---

## 5. Segurança — checklist

- [ ] Trocar **todas** as senhas de seed antes de subir.
- [ ] TLS no edge (ALB, Cloudflare, ingress).
- [ ] `CORS_ORIGIN` restrito ao domínio do front.
- [ ] `JWT_*_SECRET` rotacionados periodicamente.
- [ ] Remover `cookie-parser`/`CORS` permissivo se não utilizados.
- [ ] Healthcheck atrás de balanceador — ajustar `start_period`.
- [ ] Ativar log aggregating (Loki/Datadog) — o `requestId` já sai nos logs.
- [ ] Considerar refresh tokens em cookie `HttpOnly + Secure + SameSite=Strict`.

> **Não declare produção segura** até validar isto em um staging real.

---

## 6. Sugestões de plataforma

- **Render / Railway / Fly.io** — bom suporte a Dockerfiles multi-stage.
- **AWS ECS/Fargate** — use RDS para Postgres, EFS ou S3 para backup de
  migrations.
- **Kubernetes** — chart simples: 1 deployment (api) + 1 statefulset (db)
  + secret para env vars.

---

## 7. CI/CD — exemplo GitHub Actions

```yaml
name: build-and-push
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm test
      - run: npm run build

      - name: Login to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/<org>/<repo>:sha-${{ github.sha }}
```

> Em produção, antes de promover a imagem, rode `prisma migrate deploy`.

---

## 8. Limites conhecidos

- JWT HS256 funciona bem para **uma API**. Para multi-serviço, use
  RS256/EdDSA com JWKS.
- Rate limit é por IP. Para planos BYOIP, ajustar `ThrottlerModule`.
- Logs vão para stdout — coleta fica a cargo do runtime.
- Sem *tracing* distribuído (OpenTelemetry). Para ligar, plugar
  `@opentelemetry/instrumentation-nestjs-core`.
