import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = 'Loading...', className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
