import { api } from '@/lib/axios';
import { env } from '@/lib/env';

import type { Session, User } from '../types';
import { authMock } from '../mocks/auth-mock';
import {
  sessionSchema,
  type PasswordRecoveryRequest,
  type SignInRequest,
} from '../schemas/auth-schemas';

function shouldUseMocks(): boolean {
  return env.VITE_USE_MOCKS;
}

async function safeSessionParse(payload: unknown): Promise<Session> {
  const parsed = sessionSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid session payload received from the server.');
  }
  return parsed.data as Session;
}

function getStoredSession(): Session | null {
  const stored = sessionStorage.getItem(env.VITE_AUTH_TOKEN_KEY);
  if (!stored) return null;
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(stored));
    return parsed.success ? (parsed.data as Session) : null;
  } catch {
    return null;
  }
}

export const authService = {
  async signIn(payload: SignInRequest): Promise<Session> {
    if (shouldUseMocks()) {
      const session = await authMock.signIn(payload);
      sessionStorage.setItem(env.VITE_AUTH_TOKEN_KEY, JSON.stringify(session));
      return session;
    }

    const response = await api.post<unknown>('/auth/login', payload);
    const session = await safeSessionParse(response.data);
    sessionStorage.setItem(env.VITE_AUTH_TOKEN_KEY, JSON.stringify(session));
    return session;
  },

  async requestPasswordRecovery(payload: PasswordRecoveryRequest): Promise<{ message: string }> {
    if (shouldUseMocks()) {
      return authMock.requestPasswordRecovery(payload);
    }
    const response = await api.post<{ message: string }>('/auth/forgot-password', payload);
    return response.data;
  },

  async signOut(): Promise<void> {
    if (!shouldUseMocks()) {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore network errors on sign-out
      }
    }
    sessionStorage.removeItem(env.VITE_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(env.VITE_AUTH_REFRESH_KEY);
  },

  async getCurrentSession(): Promise<Session | null> {
    const stored = getStoredSession();
    if (stored) return stored;
    if (shouldUseMocks()) {
      return null;
    }
    try {
      const response = await api.get<unknown>('/auth/me');
      const session = await safeSessionParse(response.data);
      sessionStorage.setItem(env.VITE_AUTH_TOKEN_KEY, JSON.stringify(session));
      return session;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();
    return session?.user ?? null;
  },
};
