# =============================================================================
# Stage 1 — Builder
# =============================================================================
FROM node:22-bookworm-slim AS builder

ENV NODE_ENV=build \
    NPM_CONFIG_LOGLEVEL=warn \
    CI=true

WORKDIR /app

# Install OpenSSL — required by Prisma engines for PostgreSQL connections
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install deps separately to leverage layer cache
COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install --no-audit --no-fund

# Generate Prisma Client before copying source (so the client matches schema.prisma)
RUN npx prisma generate

# Build the application
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build

# Remove dev dependencies for a leaner production install
RUN npm prune --omit=dev


# =============================================================================
# Stage 2 — Runtime
# =============================================================================
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Runtime deps: openssl for Prisma, tini for proper signal handling
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini curl \
 && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home --shell /bin/bash nestjs

# Copy production artifacts
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

# Tini ensures graceful shutdown and proper signal forwarding
ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "dist/main.js"]
