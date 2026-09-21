import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

import { userRoleSchema } from './create-user.schema';

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    email: z
      .email({ message: 'Invalid email address' })
      .max(255)
      .transform((value) => value.toLowerCase())
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .optional(),
    role: userRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export type UpdateUserInput = UpdateUserDto;
