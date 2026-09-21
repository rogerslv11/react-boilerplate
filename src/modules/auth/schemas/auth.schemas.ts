import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  UuidSchema,
} from '@/common/utils/zod-schemas';

export const RegisterSchema = z.object({
  name: nameSchema('Name', 100),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const AuthUserIdParamSchema = UuidSchema;

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;
