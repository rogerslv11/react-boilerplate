import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/app';

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = 'Page not found',
  description = 'The page you are looking for does not exist or has been moved.',
}: NotFoundPageProps) {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">404</h1>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild>
          <Link to={ROUTES.DASHBOARD}>Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
