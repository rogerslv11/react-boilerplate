import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '../services/dashboard-service';

export function useActivityQuery(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit] as const,
    queryFn: () => dashboardService.listActivity(limit),
  });
}
