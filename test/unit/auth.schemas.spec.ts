import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
} from '@/modules/auth/schemas/auth.schemas';

describe('Auth Zod schemas', () => {
  describe('RegisterSchema', () => {
    it('accepts valid registration data', () => {
      const result = RegisterSchema.safeParse({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email', () => {
      const result = RegisterSchema.safeParse({
        name: 'Bob',
        email: 'bob-at-example',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without digits', () => {
      const result = RegisterSchema.safeParse({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'NoDigitsHere',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('requires password', () => {
      const result = LoginSchema.safeParse({ email: 'bob@example.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('accepts a normal login payload', () => {
      const result = LoginSchema.safeParse({
        email: 'bob@example.com',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('RefreshTokenSchema', () => {
    it('rejects empty/short tokens', () => {
      const result = RefreshTokenSchema.safeParse({ refreshToken: 'abc' });
      expect(result.success).toBe(false);
    });

    it('accepts a non-trivial token', () => {
      const result = RefreshTokenSchema.safeParse({
        refreshToken: 'a'.repeat(20),
      });
      expect(result.success).toBe(true);
    });
  });
});
