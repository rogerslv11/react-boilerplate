export type CustomerStatus = 'active' | 'pending' | 'inactive';
export type CustomerPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  plan: CustomerPlan;
  monthlyRevenue: number;
  joinedAt: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  delta: number;
  trend: 'up' | 'down' | 'flat';
  helper?: string;
}

export interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface DashboardData {
  metrics: MetricCard[];
  customers: Customer[];
  activity: ActivityEntry[];
}

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CustomerStatus | 'all';
  plan?: CustomerPlan | 'all';
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
