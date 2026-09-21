import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZod = any;

export interface ZodToOpenApiOptions {
  name?: string;
  description?: string;
  required?: boolean;
  example?: unknown;
  isArray?: boolean;
}

/**
 * Convert a Zod schema into an OpenAPI-compatible JSON object.
 * Descriptions declared via `.describe()` are preserved.
 */
export function zodToOpenApi(schema: AnyZod, options: ZodToOpenApiOptions = {}): object {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema } = require('zod-to-json-schema') as {
    zodToJsonSchema: (s: AnyZod, o: { name?: string; $refStrategy: string; target: string }) => object;
  };
  const json = zodToJsonSchema(schema, {
    name: options.name,
    $refStrategy: 'none',
    target: 'openApi3',
  });
  if (options.isArray) {
    return { type: 'array', items: json };
  }
  return json;
}

interface ZodBodyOptions {
  schema: AnyZod;
  description?: string;
  required?: boolean;
  isArray?: boolean;
}

/** OpenAPI body decorator that derives its schema from a Zod schema. */
export function ApiZodBody({ schema, description, required = true, isArray = false }: ZodBodyOptions) {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: zodToOpenApi(schema, { isArray }) as never,
      description,
      required,
    })(target, propertyKey, descriptor);
  };
}

interface ZodQueryOptions {
  schema: AnyZod;
  description?: string;
  required?: boolean;
}

export function ApiZodQuery({ schema, description, required = false }: ZodQueryOptions) {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    ApiQuery({
      schema: zodToOpenApi(schema) as never,
      description,
      required,
    })(target, propertyKey, descriptor);
  };
}

interface ZodResponseOptions {
  schema: AnyZod;
  status?: number;
  description?: string;
  isArray?: boolean;
}

export function ApiZodResponse({
  schema,
  status = 200,
  description,
  isArray = false,
}: ZodResponseOptions) {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    ApiResponse({
      status,
      schema: zodToOpenApi(schema, { isArray }),
      description,
    })(target, propertyKey, descriptor);
  };
}
