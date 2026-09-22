import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/shared/theme-toggle';
import { env } from '@/lib/env';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 sm:p-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            {env.VITE_APP_NAME}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-primary-foreground">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium">
              &ldquo;A scalable, opinionated foundation for production-ready React
              applications.&rdquo;
            </p>
            <footer className="text-sm opacity-80">React Boilerplate</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
