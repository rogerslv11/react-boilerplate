import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { env } from '@/lib/env';
import { authService } from '@/features/auth/services/auth-service';
import type { Session, User } from '@/features/auth/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .getCurrentSession()
      .then((current) => {
        if (!mounted) return;
        setSession(current);
        setUser(current?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const handleUnauthorized = () => {
      setSession(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      mounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn({ email, password });
    setSession(result);
    setUser(result.user);
    sessionStorage.setItem(env.VITE_AUTH_TOKEN_KEY, result.token);
    sessionStorage.setItem(env.VITE_AUTH_REFRESH_KEY, result.refreshToken);
    toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    sessionStorage.removeItem(env.VITE_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(env.VITE_AUTH_REFRESH_KEY);
    setSession(null);
    setUser(null);
    toast.info('You have been signed out.');
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    await authService.requestPasswordRecovery({ email });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user && session),
      isLoading,
      signIn,
      signOut,
      recoverPassword,
    }),
    [user, session, isLoading, signIn, signOut, recoverPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
