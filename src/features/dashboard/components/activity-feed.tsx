import { Activity, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { formatDate } from '@/lib/utils';

import { useActivityQuery } from '../hooks/use-activity-query';

export function ActivityFeed() {
  const query = useActivityQuery(8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" /> Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {query.isError && (
          <ErrorState
            title="Failed to load activity"
            message={query.error instanceof Error ? query.error.message : undefined}
            onRetry={() => void query.refetch()}
          />
        )}

        {query.isLoading && (
          <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {query.data && query.data.length > 0 && (
          <ul className="space-y-4">
            {query.data.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p>
                    <strong className="font-medium">{entry.user}</strong>{' '}
                    <span className="text-muted-foreground">{entry.action}</span>{' '}
                    <strong className="font-medium">{entry.target}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {query.data && query.data.length === 0 && (
          <EmptyState
            title="No recent activity"
            description="Activity from your team will appear here."
          />
        )}

        {query.isFetching && !query.isLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Refreshing
          </div>
        )}
      </CardContent>
    </Card>
  );
}
