import { describe, it, expect } from 'vitest';
import { EnvSchema } from '@/config/env.schema';const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  HOST: '127.0.0.1',
  API_PREFIX: 'api',
  API_VERSION: 'v1',
  CORS_ORIGIN: 'http://localhost:5173',
  CORS_CREDENTIALS: 'false',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app_db?schema=public',
  DATABASE_LOG_LEVEL: 'warn',
  DATABASE_POOL_SIZE: '10',
  LOG_LEVEL: 'info',
  LOG_PRETTY: 'false',
  THROTTLE_TTL: '60',
  THROTTLE_LIMIT: '120',
  JWT_SECRET: 'a'.repeat(32),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_REFRESH_EXPIRES_IN: '7d',
  SWAGGER_ENABLED: 'true',
  SWAGGER_PATH: 'docs',
  SWAGGER_TITLE: 'API',
  SWAGGER_DESCRIPTION: 'desc',
  SWAGGER_VERSION: '1.0.0',
};

describe('EnvSchema', () => {
  it('parses a fully populated environment', () => {
    const result = EnvSchema.safeParse({ ...baseEnv });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(result.data.CORS_ORIGIN).toEqual(['http://localhost:5173']);
      expect(result.data.CORS_CREDENTIALS).toBe(false);
    }
  });

  it('applies defaults for missing optional variables', () => {
    const partial: NodeJS.ProcessEnv = { ...baseEnv };
    delete partial.LOG_LEVEL;
    delete partial.PORT;
    delete partial.THROTTLE_LIMIT;
    const result = EnvSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.LOG_LEVEL).toBe('info');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.THROTTLE_LIMIT).toBe(120);
    }
  });

  it('rejects short JWT_SECRET', () => {
    const result = EnvSchema.safeParse({ ...baseEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects missing DATABASE_URL', () => {
    const partial = { ...baseEnv };
    delete partial.DATABASE_URL;
    const result = EnvSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it('parses * as wildcard CORS origin', () => {
    const result = EnvSchema.safeParse({ ...baseEnv, CORS_ORIGIN: '*' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGIN).toEqual(['*']);
    }
  });

  it('parses comma-separated CORS origins', () => {
    const result = EnvSchema.safeParse({
      ...baseEnv,
      CORS_ORIGIN: 'http://a.com, http://b.com ,http://c.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGIN).toEqual(['http://a.com', 'http://b.com', 'http://c.com']);
    }
  });

  it('parses boolean-like strings', () => {
    const result = EnvSchema.safeParse({ ...baseEnv, CORS_CREDENTIALS: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_CREDENTIALS).toBe(true);
    }
  });
});
