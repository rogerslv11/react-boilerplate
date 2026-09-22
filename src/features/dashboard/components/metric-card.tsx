import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { MetricCard as MetricCardData } from '../types';

interface MetricCardProps {
  metric: MetricCardData;
}

export function MetricCard({ metric }: MetricCardProps) {
  const formatted =
    metric.format === 'currency'
      ? formatCurrency(metric.value)
      : metric.format === 'percent'
        ? `${formatNumber(metric.value, 'en-US')}%`
        : formatNumber(metric.value);

  const TrendIcon = metric.trend === 'up' ? ArrowUp : metric.trend === 'down' ? ArrowDown : Minus;

  const trendColor =
    metric.trend === 'up'
      ? 'text-success'
      : metric.trend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{formatted}</div>
        <div className={cn('mt-2 flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          <span className="font-medium">{Math.abs(metric.delta).toFixed(1)}%</span>
          <span className="text-muted-foreground">{metric.helper}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-3 h-3 w-20" />
      </CardContent>
    </Card>
  );
}
