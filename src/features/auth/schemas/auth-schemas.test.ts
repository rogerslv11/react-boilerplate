import { describe, expect, it } from 'vitest';

import { loginSchema, forgotPasswordSchema } from '@/features/auth/schemas/auth-schemas';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const parsed = loginSchema.safeParse({
      email: 'ada@boilerplate.dev',
      password: 'password123',
      remember: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const parsed = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path[0]).toBe('email');
    }
  });

  it('rejects short passwords', () => {
    const parsed = loginSchema.safeParse({ email: 'ada@boilerplate.dev', password: '123' });
    expect(parsed.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('requires an email', () => {
    const parsed = forgotPasswordSchema.safeParse({ email: '' });
    expect(parsed.success).toBe(false);
  });

  it('accepts valid emails', () => {
    const parsed = forgotPasswordSchema.safeParse({ email: 'ada@boilerplate.dev' });
    expect(parsed.success).toBe(true);
  });
});
