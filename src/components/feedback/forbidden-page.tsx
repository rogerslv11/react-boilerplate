import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/app';

export function ForbiddenPage() {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
          <ShieldOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">403</h1>
        <p className="text-lg font-semibold">Access denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access this page. If you believe this is an error, contact
          an administrator.
        </p>
        <Button asChild>
          <Link to={ROUTES.DASHBOARD}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
