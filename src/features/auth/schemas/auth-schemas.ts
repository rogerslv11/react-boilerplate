import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const signInRequestSchema = loginSchema.omit({ remember: true });
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const passwordRecoveryRequestSchema = forgotPasswordSchema;
export type PasswordRecoveryRequest = z.infer<typeof passwordRecoveryRequestSchema>;

export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'manager', 'member', 'viewer']),
    avatarUrl: z.string().url().optional(),
    createdAt: z.string(),
  }),
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string(),
});

export type SessionDto = z.infer<typeof sessionSchema>;
