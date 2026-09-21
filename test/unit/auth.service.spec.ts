import { describe, it, expect } from 'vitest';
import * as argon2 from 'argon2';
import { AuthService } from '@/modules/auth/auth.service';
import { type UsersService } from '@/modules/users/services/users.service';
import { UsersRepository } from '@/modules/users/repositories/users.repository';
import { type JwtService } from '@nestjs/jwt';
import { type ConfigService } from '@nestjs/config';
import { type PrismaService } from '@/infrastructure/database/prisma.service';
import type { LoginInput, RegisterInput } from '@/modules/auth/schemas';

class FakeUsersService {
  async create(payload: RegisterInput) {
    return { id: 'u1', email: payload.email.toLowerCase(), name: payload.name, role: 'USER' as const, status: 'ACTIVE' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  async findRawByEmail(email: string) {
    if (email !== 'alice@example.com') return null;
    return {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      password: await argon2.hash('Strong1Pass'),
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }
  async findById() {
    throw new Error('not used');
  }
}

class FakeJwtService {
  async signAsync(payload: object, options?: { expiresIn?: string | number }) {
    return `token.${JSON.stringify({ ...payload, options })}.sig`;
  }
}

class FakeConfigService {
  get(key: string) {
    const values: Record<string, string> = {
      'auth.jwtSecret': 'a'.repeat(32),
      'auth.jwtAccessExpiresIn': '15m',
      'auth.jwtRefreshExpiresIn': '7d',
    };
    return values[key];
  }
}

class FakePrismaService {
  refreshToken = {
    async create() {
      return {} as never;
    },
    async findUnique() {
      return null;
    },
    async update() {
      return {} as never;
    },
    async updateMany() {
      return { count: 0 };
    },
  };
  async $connect() {}
  async $disconnect() {}
}

describe('AuthService', () => {
  const makeService = () => {
    const users = new FakeUsersService();
    const fakePrisma = new FakePrismaService();
    const fakeJwt = new FakeJwtService();
    const fakeConfig = new FakeConfigService();
    return new AuthService(
      users as unknown as UsersService,
      fakeJwt as unknown as JwtService,
      fakeConfig as unknown as ConfigService,
      fakePrisma as unknown as PrismaService,
    );
  };

  it('registers a new account and returns tokens', async () => {
    const svc = makeService();
    const result = await svc.register({ name: 'Alice', email: 'alice@example.com', password: 'Strong1Pass' });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBeGreaterThan(0);
  });

  it('logs a user in with valid credentials', async () => {
    const svc = makeService();
    const loginInput: LoginInput = { email: 'alice@example.com', password: 'Strong1Pass' };
    const result = await svc.login(loginInput);
    expect(result.accessToken).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    const svc = makeService();
    await expect(svc.login({ email: 'alice@example.com', password: 'WrongPass1' })).rejects.toThrow();
  });

  it('rejects login for unknown user with a generic error', async () => {
    const svc = makeService();
    await expect(svc.login({ email: 'ghost@example.com', password: 'whatever1' })).rejects.toThrow();
  });
});

void UsersRepository;
