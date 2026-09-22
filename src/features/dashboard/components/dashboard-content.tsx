import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ActivityFeed } from './activity-feed';
import { CustomersTable } from './customers-table';
import { MetricCard, MetricCardSkeleton } from './metric-card';
import { useDashboardQuery } from '../hooks/use-dashboard-query';

function MetricGrid() {
  const query = useDashboardQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {query.isLoading
        ? Array.from({ length: 4 }).map((_, idx) => <MetricCardSkeleton key={idx} />)
        : query.data?.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
    </div>
  );
}

function DashboardHeader() {
  const query = useDashboardQuery();
  const date = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{date}</p>
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back{query.data ? '' : '!'}</h2>
      <p className="text-sm text-muted-foreground">Here is a snapshot of your platform activity.</p>
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <Suspense fallback={null}>
        <MetricGrid />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Customers</CardTitle>
            <CardDescription>Manage your customer accounts, plans, and status.</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomersTable />
          </CardContent>
        </Card>
        <ActivityFeed />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>Common tasks to keep your workspace tidy.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {['Invite teammate', 'Generate report', 'Sync data'].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-md border bg-card p-4 text-left text-sm font-medium transition hover:bg-accent"
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
