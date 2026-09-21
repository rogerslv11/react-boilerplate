import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { PaginationSchema, atLeastOne, emailSchema, nameSchema, passwordSchema } from '@/common/utils/zod-schemas';

/** Literal unions derived from the Prisma enums. */
const userRoleEnum = z.enum([UserRole.ADMIN, UserRole.USER]);
const userStatusEnum = z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]);

// =============================================================================
// Input schemas
// =============================================================================

export const CreateUserSchema = z.object({
  name: nameSchema('Name', 100),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleEnum.default(UserRole.USER),
  status: userStatusEnum.default(UserStatus.ACTIVE),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = atLeastOne(
  z.object({
    name: nameSchema('Name', 100).optional(),
    email: emailSchema.optional(),
    role: userRoleEnum.optional(),
    status: userStatusEnum.optional(),
  }),
);

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must differ from the current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// =============================================================================
// Param / query schemas
// =============================================================================

export const UserIdParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});
export type UserIdParam = z.infer<typeof UserIdParamSchema>;

export const ListUsersQuerySchema = PaginationSchema.extend({
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

// =============================================================================
// Output schemas (Swagger / response typing)
// =============================================================================

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleEnum,
  status: userStatusEnum,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
