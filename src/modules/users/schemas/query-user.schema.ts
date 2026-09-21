import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

import { paginationSchema } from '@/shared/types/pagination';
import { userRoleSchema } from './create-user.schema';

export const queryUsersSchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: userRoleSchema.optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
    .optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export class QueryUsersDto extends createZodDto(queryUsersSchema) {}
export type QueryUsersInput = QueryUsersDto;
