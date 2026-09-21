import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

export const userRoleSchema = z.enum(['user', 'admin']);

export const createUserSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .email({ message: 'Invalid email address' })
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  role: userRoleSchema.optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
export type CreateUserInput = CreateUserDto;
