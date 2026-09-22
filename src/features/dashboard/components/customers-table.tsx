import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { PAGINATION } from '@/constants/app';
import { formatCurrency, formatDate } from '@/lib/utils';

import { CustomerFilters } from './customer-filters';
import { Pagination } from './pagination';
import { useCustomersQuery } from '../hooks/use-customers-query';
import type { Customer, CustomerListParams } from '../types';

const STATUS_VARIANT: Record<Customer['status'], 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
};

const PLAN_VARIANT: Record<Customer['plan'], 'default' | 'secondary' | 'outline'> = {
  free: 'outline',
  starter: 'secondary',
  pro: 'default',
  enterprise: 'default',
};

export function CustomersTable() {
  const [filters, setFilters] = useState<CustomerListParams>({
    page: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    search: '',
    status: 'all',
    plan: 'all',
  });

  const query = useCustomersQuery(filters);

  const totals = useMemo(() => {
    if (!query.data)
      return { total: 0, page: 1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, totalPages: 1 };
    return query.data.meta;
  }, [query.data]);

  return (
    <div className="space-y-4">
      <CustomerFilters value={filters} onChange={setFilters} />

      {query.isError && (
        <ErrorState
          title="Failed to load customers"
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-right">MRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.data && query.data.data.length > 0 ? (
              query.data.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[customer.status]} className="capitalize">
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PLAN_VARIANT[customer.plan]} className="capitalize">
                      {customer.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(customer.joinedAt)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(customer.monthlyRevenue)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    title="No customers found"
                    description="Try adjusting your search or filters."
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          page={totals.page}
          pageSize={totals.pageSize}
          total={totals.total}
          totalPages={totals.totalPages}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          onPageSizeChange={(pageSize) =>
            setFilters((current) => ({ ...current, pageSize, page: PAGINATION.DEFAULT_PAGE }))
          }
        />
      </div>
    </div>
  );
}
