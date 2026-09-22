import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['active', 'pending', 'inactive']),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
  monthlyRevenue: z.number().nonnegative(),
  joinedAt: z.string(),
});

export const activityEntrySchema = z.object({
  id: z.string(),
  user: z.string(),
  action: z.string(),
  target: z.string(),
  timestamp: z.string(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().positive(),
    }),
  });
