import type { Session, User } from '../types';
import type { PasswordRecoveryRequest, SignInRequest } from '../schemas/auth-schemas';

const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'usr_001',
    name: 'Ada Lovelace',
    email: 'ada@boilerplate.dev',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00.000Z',
    password: 'password',
  },
  {
    id: 'usr_002',
    name: 'Grace Hopper',
    email: 'grace@boilerplate.dev',
    role: 'manager',
    createdAt: '2024-02-10T10:00:00.000Z',
    password: 'password',
  },
  {
    id: 'usr_003',
    name: 'Alan Turing',
    email: 'alan@boilerplate.dev',
    role: 'member',
    createdAt: '2024-03-05T10:00:00.000Z',
    password: 'password',
  },
];

function toPublicUser(user: User & { password: string }): User {
  const { password: _password, ...publicUser } = user;
  void _password;
  return publicUser;
}

function buildSession(user: User): Session {
  return {
    user,
    token: `mock-token-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const authMock = {
  async signIn(payload: SignInRequest): Promise<Session> {
    await new Promise((r) => setTimeout(r, 600));
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!found || found.password !== payload.password) {
      const error = new Error('Invalid email or password.') as Error & { code: string };
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }
    return buildSession(toPublicUser(found));
  },

  async requestPasswordRecovery(payload: PasswordRecoveryRequest): Promise<{ message: string }> {
    await new Promise((r) => setTimeout(r, 600));
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!found) {
      return delay({ message: 'If the account exists, a recovery email has been sent.' });
    }
    return delay({ message: 'If the account exists, a recovery email has been sent.' });
  },

  async signOut(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
  },

  async refresh(): Promise<Session | null> {
    return delay(null);
  },
};
