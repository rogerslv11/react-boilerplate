import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'rounded-lg border border-border shadow-lg',
                title: 'font-semibold',
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
