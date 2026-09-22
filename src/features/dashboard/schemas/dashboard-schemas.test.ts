import { describe, expect, it } from 'vitest';

import {
  customerSchema,
  paginatedResponseSchema,
} from '@/features/dashboard/schemas/dashboard-schemas';

describe('customerSchema', () => {
  it('parses valid customers', () => {
    const parsed = customerSchema.safeParse({
      id: 'cus_1',
      name: 'Acme',
      email: 'hello@acme.com',
      status: 'active',
      plan: 'pro',
      monthlyRevenue: 100,
      joinedAt: '2024-01-01T00:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const parsed = customerSchema.safeParse({
      id: 'cus_1',
      name: 'Acme',
      email: 'hello@acme.com',
      status: 'unknown',
      plan: 'pro',
      monthlyRevenue: 0,
      joinedAt: '2024-01-01T00:00:00.000Z',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('paginatedResponseSchema', () => {
  it('parses paginated payloads', () => {
    const schema = paginatedResponseSchema(customerSchema);
    const parsed = schema.safeParse({
      data: [
        {
          id: 'cus_1',
          name: 'Acme',
          email: 'hello@acme.com',
          status: 'active',
          plan: 'pro',
          monthlyRevenue: 100,
          joinedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    expect(parsed.success).toBe(true);
  });
});
