import { describe, it, expect } from 'vitest';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  ListUsersQuerySchema,
  UserIdParamSchema,
} from '@/modules/users/schemas/users.schemas';

describe('Users Zod schemas', () => {
  describe('CreateUserSchema', () => {
    it('accepts a valid payload', () => {
      const result = CreateUserSchema.safeParse({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = CreateUserSchema.safeParse({
        name: 'Alice',
        email: 'not-an-email',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('email');
      }
    });

    it('rejects short password', () => {
      const result = CreateUserSchema.safeParse({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('normalizes email to lowercase and trims whitespace', () => {
      const result = CreateUserSchema.safeParse({
        name: 'Alice',
        email: '  Alice@Example.com  ',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('alice@example.com');
      }
    });

    it('rejects name with less than 2 characters', () => {
      const result = CreateUserSchema.safeParse({
        name: 'A',
        email: 'alice@example.com',
        password: 'Strong1Pass',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateUserSchema', () => {
    it('requires at least one field', () => {
      const result = UpdateUserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts a partial update', () => {
      const result = UpdateUserSchema.safeParse({ name: 'Alice Updated' });
      expect(result.success).toBe(true);
    });
  });

  describe('ChangePasswordSchema', () => {
    it('rejects when new password equals current password', () => {
      const result = ChangePasswordSchema.safeParse({
        currentPassword: 'Strong1Pass',
        newPassword: 'Strong1Pass',
      });
      expect(result.success).toBe(false);
    });

    it('accepts differing passwords', () => {
      const result = ChangePasswordSchema.safeParse({
        currentPassword: 'Strong1Pass',
        newPassword: 'Strong2Pass',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ListUsersQuerySchema', () => {
    it('applies pagination defaults', () => {
      const result = ListUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('rejects pageSize above maximum', () => {
      const result = ListUsersQuerySchema.safeParse({ pageSize: 9999 });
      expect(result.success).toBe(false);
    });

    it('coerces query strings to numbers', () => {
      const result = ListUsersQuerySchema.safeParse({ page: '3', pageSize: '15' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(15);
      }
    });
  });

  describe('UserIdParamSchema', () => {
    it('accepts a valid uuid', () => {
      const result = UserIdParamSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid uuid', () => {
      const result = UserIdParamSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });
});
