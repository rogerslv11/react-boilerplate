import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiError } from '@/lib/axios';
import { QUERY_STALE_TIMES } from '@/constants/app';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIMES.MEDIUM,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        const apiError = getApiError(error);
        if (apiError.code === 'CANCELED' || apiError.code === 'UNAUTHORIZED') return false;
        if (apiError.status && apiError.status >= 400 && apiError.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        const apiError = getApiError(error);
        if (apiError.code !== 'CANCELED') {
          toast.error(apiError.message);
        }
      },
    },
  },
});
