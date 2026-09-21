import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

export const idParamSchema = z.object({
  id: z.uuid({ message: 'id must be a valid UUID' }),
});

export class IdParamDto extends createZodDto(idParamSchema) {}
export type IdParam = IdParamDto;
