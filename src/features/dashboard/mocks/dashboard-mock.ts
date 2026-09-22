import type { ActivityEntry, Customer, DashboardData, PaginatedCustomers } from '../types';

const CUSTOMERS: Customer[] = [
  {
    id: 'cus_001',
    name: 'Northwind Trading',
    email: 'billing@northwind.io',
    status: 'active',
    plan: 'enterprise',
    monthlyRevenue: 12480,
    joinedAt: '2023-04-12T08:00:00.000Z',
  },
  {
    id: 'cus_002',
    name: 'Acme Logistics',
    email: 'finance@acme-logistics.com',
    status: 'active',
    plan: 'pro',
    monthlyRevenue: 4280,
    joinedAt: '2023-07-30T08:00:00.000Z',
  },
  {
    id: 'cus_003',
    name: 'Globex Industries',
    email: 'accounts@globex.com',
    status: 'pending',
    plan: 'starter',
    monthlyRevenue: 1280,
    joinedAt: '2024-01-18T08:00:00.000Z',
  },
  {
    id: 'cus_004',
    name: 'Initech',
    email: 'ops@initech.dev',
    status: 'inactive',
    plan: 'free',
    monthlyRevenue: 0,
    joinedAt: '2024-02-22T08:00:00.000Z',
  },
  {
    id: 'cus_005',
    name: 'Soylent Corp',
    email: 'hello@soylent.io',
    status: 'active',
    plan: 'pro',
    monthlyRevenue: 3120,
    joinedAt: '2024-03-05T08:00:00.000Z',
  },
  {
    id: 'cus_006',
    name: 'Hooli',
    email: 'finance@hooli.xyz',
    status: 'active',
    plan: 'enterprise',
    monthlyRevenue: 18900,
    joinedAt: '2024-04-14T08:00:00.000Z',
  },
  {
    id: 'cus_007',
    name: 'Pied Piper',
    email: 'team@piedpiper.com',
    status: 'pending',
    plan: 'starter',
    monthlyRevenue: 990,
    joinedAt: '2024-05-02T08:00:00.000Z',
  },
  {
    id: 'cus_008',
    name: 'Wonka Industries',
    email: 'ops@wonka.co',
    status: 'active',
    plan: 'pro',
    monthlyRevenue: 5480,
    joinedAt: '2024-05-26T08:00:00.000Z',
  },
  {
    id: 'cus_009',
    name: 'Vandelay Imports',
    email: 'sales@vandelay.com',
    status: 'inactive',
    plan: 'free',
    monthlyRevenue: 0,
    joinedAt: '2024-06-10T08:00:00.000Z',
  },
  {
    id: 'cus_010',
    name: 'Stark Industries',
    email: 'finance@stark.io',
    status: 'active',
    plan: 'enterprise',
    monthlyRevenue: 22340,
    joinedAt: '2024-07-01T08:00:00.000Z',
  },
  {
    id: 'cus_011',
    name: 'Wayne Enterprises',
    email: 'billing@wayne.com',
    status: 'active',
    plan: 'enterprise',
    monthlyRevenue: 15800,
    joinedAt: '2024-07-22T08:00:00.000Z',
  },
  {
    id: 'cus_012',
    name: 'Cyberdyne Systems',
    email: 'ops@cyberdyne.io',
    status: 'pending',
    plan: 'starter',
    monthlyRevenue: 1240,
    joinedAt: '2024-08-12T08:00:00.000Z',
  },
];

const ACTIVITY: ActivityEntry[] = [
  {
    id: 'act_001',
    user: 'Ada Lovelace',
    action: 'invited',
    target: 'Grace Hopper',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    id: 'act_002',
    user: 'Alan Turing',
    action: 'updated plan for',
    target: 'Hooli',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'act_003',
    user: 'Grace Hopper',
    action: 'closed deal with',
    target: 'Stark Industries',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'act_004',
    user: 'Ada Lovelace',
    action: 'archived',
    target: 'Initech',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'act_005',
    user: 'Alan Turing',
    action: 'created invoice for',
    target: 'Wayne Enterprises',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const DASHBOARD_DATA: DashboardData = {
  metrics: [
    {
      id: 'mrr',
      label: 'Monthly Recurring Revenue',
      value: 85480,
      format: 'currency',
      delta: 12.4,
      trend: 'up',
      helper: 'vs. last month',
    },
    {
      id: 'customers',
      label: 'Active Customers',
      value: 248,
      format: 'number',
      delta: 5.2,
      trend: 'up',
      helper: 'vs. last month',
    },
    {
      id: 'churn',
      label: 'Churn Rate',
      value: 1.8,
      format: 'percent',
      delta: -0.4,
      trend: 'down',
      helper: 'vs. last month',
    },
    {
      id: 'avg-ticket',
      label: 'Avg. Ticket',
      value: 344.6,
      format: 'currency',
      delta: 0,
      trend: 'flat',
      helper: 'no change',
    },
  ],
  customers: CUSTOMERS,
  activity: ACTIVITY,
};

function paginate(items: Customer[], page: number, pageSize: number): PaginatedCustomers {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page: safePage, pageSize, total, totalPages },
  };
}

export const dashboardMock = {
  async getDashboardData(): Promise<DashboardData> {
    await new Promise((r) => setTimeout(r, 350));
    return structuredClone(DASHBOARD_DATA);
  },

  async listCustomers({
    page = 1,
    pageSize = 10,
    search = '',
    status = 'all',
    plan = 'all',
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    plan?: string;
  } = {}): Promise<PaginatedCustomers> {
    await new Promise((r) => setTimeout(r, 250));
    let filtered = DASHBOARD_DATA.customers;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term),
      );
    }
    if (status !== 'all') {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (plan !== 'all') {
      filtered = filtered.filter((c) => c.plan === plan);
    }
    return paginate(filtered, page, pageSize);
  },

  async listActivity(limit = 10): Promise<ActivityEntry[]> {
    await new Promise((r) => setTimeout(r, 200));
    return DASHBOARD_DATA.activity.slice(0, limit);
  },
};
