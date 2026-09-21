import { z } from 'zod';

/**
 * Schema to validate environment variables loaded from process.env
 * before the application starts. The application fails immediately
 * with a clear message if any required variable is missing or invalid.
 */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  APP_NAME: z.string().min(1).default('nestjs-boilerplate'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  API_PREFIX: z.string().default('api'),
  API_VERSION: z.string().default('v1'),

  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((v) =>
      v === '*'
        ? ['*']
        : v
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean),
    ),
  CORS_CREDENTIALS: z
    .union([z.boolean(), z.string()])
    .default('false')
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true' || v === '1')),

  DATABASE_URL: z.string().url(),
  DATABASE_LOG_LEVEL: z
    .enum(['info', 'query', 'warn', 'error'])
    .default('warn'),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  LOG_PRETTY: z
    .union([z.boolean(), z.string()])
    .default('false')
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true' || v === '1')),

  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  SWAGGER_ENABLED: z
    .union([z.boolean(), z.string()])
    .default('true')
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true' || v === '1')),
  SWAGGER_PATH: z.string().default('docs'),
  SWAGGER_TITLE: z.string().default('NestJS Boilerplate API'),
  SWAGGER_DESCRIPTION: z.string().default('Professional NestJS backend boilerplate'),
  SWAGGER_VERSION: z.string().default('1.0.0'),
});

export type EnvSchema = z.infer<typeof EnvSchema>;
