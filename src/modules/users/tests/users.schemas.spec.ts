import { createUserSchema, updateUserSchema, queryUsersSchema, idParamSchema } from '../schemas';

describe('users schemas', () => {
  describe('createUserSchema', () => {
    it('validates a correct payload', () => {
      const result = createUserSchema.safeParse({
        name: 'Jane Doe',
        email: 'Jane@Example.com',
        password: 'secret123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane@example.com');
        expect(result.data.role).toBeUndefined();
      }
    });

    it('rejects short names', () => {
      const result = createUserSchema.safeParse({
        name: 'A',
        email: 'a@b.com',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short passwords', () => {
      const result = createUserSchema.safeParse({
        name: 'Jane',
        email: 'a@b.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid emails', () => {
      const result = createUserSchema.safeParse({
        name: 'Jane',
        email: 'not-an-email',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('accepts explicit role', () => {
      const result = createUserSchema.safeParse({
        name: 'Jane',
        email: 'a@b.com',
        password: 'secret123',
        role: 'admin',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserSchema', () => {
    it('rejects empty payload', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts partial updates', () => {
      const result = updateUserSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });
  });

  describe('queryUsersSchema', () => {
    it('applies defaults', () => {
      const result = queryUsersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('DESC');
      }
    });

    it('coerces string page/limit', () => {
      const result = queryUsersSchema.safeParse({ page: '2', limit: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(5);
      }
    });

    it('rejects limit over 100', () => {
      const result = queryUsersSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('accepts UUIDs', () => {
      const result = idParamSchema.safeParse({
        id: '0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID ids', () => {
      const result = idParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });
});
