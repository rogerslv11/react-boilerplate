import { z } from 'zod';

import { api } from '@/lib/axios';
import { env } from '@/lib/env';

import { dashboardMock } from '../mocks/dashboard-mock';
import {
  activityEntrySchema,
  customerSchema,
  paginatedResponseSchema,
} from '../schemas/dashboard-schemas';
import type {
  ActivityEntry,
  CustomerListParams,
  DashboardData,
  PaginatedCustomers,
} from '../types';

function shouldUseMocks(): boolean {
  return env.VITE_USE_MOCKS;
}

function parseActivity(payload: unknown): ActivityEntry[] {
  const listSchema = z.array(activityEntrySchema);
  const parsed = listSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid activity payload received from the server.');
  }
  return parsed.data as ActivityEntry[];
}

function buildQuery(params: CustomerListParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.search) search.set('search', params.search);
  if (params.status && params.status !== 'all') search.set('status', params.status);
  if (params.plan && params.plan !== 'all') search.set('plan', params.plan);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const paginatedSchema = paginatedResponseSchema(customerSchema);

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    if (shouldUseMocks()) return dashboardMock.getDashboardData();
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  async listCustomers(params: CustomerListParams = {}): Promise<PaginatedCustomers> {
    if (shouldUseMocks()) {
      return dashboardMock.listCustomers({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status,
        plan: params.plan,
      });
    }
    const response = await api.get<unknown>(`/customers${buildQuery(params)}`);
    const parsed = paginatedSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new Error('Invalid customers pagination payload received from the server.');
    }
    return parsed.data;
  },

  async listActivity(limit = 10): Promise<ActivityEntry[]> {
    if (shouldUseMocks()) return dashboardMock.listActivity(limit);
    const response = await api.get<unknown>(`/activity?limit=${limit}`);
    return parseActivity(response.data);
  },
};
