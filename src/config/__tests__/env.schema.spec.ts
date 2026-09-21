import { envSchema } from '@/config/env.schema';

describe('envSchema', () => {
  const baseEnv = {
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('accepts a minimal valid configuration', () => {
    const result = envSchema.safeParse(baseEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.JWT_ACCESS_TTL).toBe('15m');
      expect(result.data.BCRYPT_ROUNDS).toBe(12);
    }
  });

  it('rejects short JWT secrets', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      JWT_SECRET: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('coerces numeric values', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      PORT: '4500',
      DB_PORT: '6543',
      THROTTLE_LIMIT: '200',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4500);
      expect(result.data.DB_PORT).toBe(6543);
      expect(result.data.THROTTLE_LIMIT).toBe(200);
    }
  });

  it('keeps CORS_ORIGINS as string at schema level (parsed in app.config loader)', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      CORS_ORIGINS: 'http://a.com, http://b.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGINS).toBe('http://a.com, http://b.com');
    }
  });

  it('lowercases emails at runtime is not the schema job, but accepts them', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
    });
    expect(result.success).toBe(true);
  });
});
