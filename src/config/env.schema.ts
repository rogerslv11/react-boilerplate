import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('NestJS Boilerplate'),
  API_PREFIX: z.string().default('api/v1'),
  API_VERSION: z.coerce.number().int().positive().default(1),
  CORS_ORIGINS: z.string().optional(),
  DOCS_ENABLED: z.string().optional(),
  DOCS_PATH: z.string().default('docs'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_DATABASE: z.string().default('nestjs_boilerplate'),
  DB_LOGGING: z.string().optional(),
  DB_SYNCHRONIZE: z.string().optional(),
  DB_MIGRATIONS_RUN: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),

  REFRESH_TOKEN_COOKIE: z.string().optional(),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('rt'),
  COOKIE_SECURE: z.string().optional(),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type EnvSchema = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): EnvSchema {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n  - ');
    throw new Error(`Invalid environment variables:\n  - ${formatted}`);
  }
  return parsed.data;
}
