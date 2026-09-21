import type { ZodUUID } from 'zod';

import { z } from 'zod';

/**
 * * Helper that returns a Zod schema for a UUID path parameter with a
 * * descriptive error message. Kept as a small utility rather than a generic
 * * abstraction.
 * */
export function uuidParamSchema(name = 'id'): ZodUUID {
  return z.uuid({ message: `${name} must be a valid UUID` });
}
