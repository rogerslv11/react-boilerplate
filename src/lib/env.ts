import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('React Boilerplate'),
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3000/api'),
  VITE_API_TIMEOUT: z
    .string()
    .regex(/^\d+$/, 'VITE_API_TIMEOUT must be a positive integer (ms)')
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().positive())
    .default('15000'),
  VITE_USE_MOCKS: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('true'),
  VITE_AUTH_TOKEN_KEY: z.string().min(1).default('rb_auth_token'),
  VITE_AUTH_REFRESH_KEY: z.string().min(1).default('rb_refresh_token'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check your .env file.');
}

export const env = parsed.data;

export type AppEnv = typeof env;
