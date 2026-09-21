import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(2),
    age: z.number().int().min(0).optional(),
  });

  it('returns parsed data when valid', () => {
    const pipe = new ZodValidationPipe(schema);
    const result = pipe.transform({ name: 'Alice', age: 30 });
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws BadRequestException when invalid', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform({ name: 'A' })).toThrow(BadRequestException);
  });

  it('includes field-level errors on failure', () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const response = (e as BadRequestException).getResponse() as {
        errors?: Array<{ field: string }>;
      };
      expect(Array.isArray(response.errors)).toBe(true);
    }
  });

  it('returns parsed data even for empty input (coerces to object)', () => {
    const optionalSchema = z.object({ name: z.string().min(2).optional() });
    const pipe = new ZodValidationPipe(optionalSchema);
    expect(pipe.transform(undefined)).toEqual({});
  });
});
