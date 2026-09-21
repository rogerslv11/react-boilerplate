import { z } from 'zod';
import { APP_CONSTANTS } from '../../shared/constants';

/**
 * Common schemas shared across modules. These are intentionally simple
 * and side-effect free so they can be composed into more complex
 * validation schemas.
 */

export const UuidSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export type UuidParam = z.infer<typeof UuidSchema>;

/**
 * Standard pagination schema for list endpoints.
 * Values are coerced from string when used with query parameters.
 */
export const PaginationSchema = z.object({
  page: z
    .preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), z.number().int().min(1))
    .default(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : Number(v)),
      z
        .number()
        .int()
        .min(1)
        .max(APP_CONSTANTS.PAGINATION.MAX_PAGE_SIZE),
    )
    .default(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().max(120).optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/** Single sort enum helper. */
export const SortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrderSchema>;

/** Trims/normalizes strings before validation. */
export const stringSchema = (opts: { minLength?: number; maxLength: number; label: string }) =>
  z
    .string()
    .trim()
    .min(opts.minLength ?? 1, `${opts.label} is required`)
    .max(opts.maxLength, `${opts.label} must contain at most ${opts.maxLength} characters`);

/** Common password policy. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .max(72, 'Password must contain at most 72 characters') // argon2 cap
  .refine((p) => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter')
  .refine((p) => /[a-z]/.test(p), 'Password must contain at least one lowercase letter')
  .refine((p) => /[0-9]/.test(p), 'Password must contain at least one digit');

/** Email with normalization. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email');

/** Name fields. */
export const nameSchema = (label = 'Name', maxLength = 100) =>
  z
    .string()
    .trim()
    .min(2, `${label} must contain at least 2 characters`)
    .max(maxLength, `${label} must contain at most ${maxLength} characters`);

/**
 * Compose a partial<T> that requires at least one key when patching.
 */
export const atLeastOne = <T extends z.ZodObject<z.ZodRawShape>>(schema: T) =>
  schema.partial().refine(
    (v: Record<string, unknown>) => Object.keys(v).length > 0,
    { message: 'At least one field must be provided', path: [] },
  );

/** ISO datetime string helper (validated as ISO 8601). */
export const isoDateSchema = z.string().datetime({ offset: true });
