import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z
    .email({ message: 'Invalid email address' })
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export class RegisterDto extends createZodDto(registerSchema) {}
export type RegisterInput = RegisterDto;

export const loginSchema = z.object({
  email: z
    .email({ message: 'Invalid email address' })
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export class LoginDto extends createZodDto(loginSchema) {}
export type LoginInput = LoginDto;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export class RefreshDto extends createZodDto(refreshSchema) {}
export type RefreshInput = RefreshDto;
