import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '../services/dashboard-service';

const DASHBOARD_QUERY_KEY = ['dashboard', 'overview'] as const;

export function useDashboardQuery() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardService.getDashboardData(),
  });
}
