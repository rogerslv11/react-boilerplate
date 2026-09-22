import type { ReactNode } from 'react';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return <div className="flex min-h-svh flex-col">{children}</div>;
}
