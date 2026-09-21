import type { ZodUUID } from 'zod';

import { z } from 'zod';

export function uuidParamSchema(name = 'id'): ZodUUID {
  return z.uuid({ message: `${name} must be a valid UUID` });
}

export type AnyZodSchema = z.ZodTypeAny;
