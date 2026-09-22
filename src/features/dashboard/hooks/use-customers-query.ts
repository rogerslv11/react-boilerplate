import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { dashboardService } from '../services/dashboard-service';
import type { CustomerListParams } from '../types';

export const customerListQueryKey = (params: CustomerListParams) =>
  ['dashboard', 'customers', params] as const;

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({
    queryKey: customerListQueryKey(params),
    queryFn: () => dashboardService.listCustomers(params),
    placeholderData: keepPreviousData,
  });
}
