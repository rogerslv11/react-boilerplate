import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { type ZodError, type ZodSchema, type SafeParseReturnType } from 'zod';
import { APP_CONSTANTS } from '../../shared/constants';

export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Generic pipe that validates `body`, `query` or `params` against a Zod
 * schema and replaces the value with the parsed (and coerced) result.
 * The output type is `z.infer<TSchema>` so controllers receive
 * fully-typed, validated data.
 *
 * @example
 *   @Body(new ZodValidationPipe(CreateUserSchema)) data: CreateUserInput
 */
export class ZodValidationPipe<TSchema extends ZodSchema> implements PipeTransform {
  private readonly schema: TSchema;

  constructor(schema: TSchema) {
    this.schema = schema;
  }

  transform(value: unknown): unknown {
    const result: SafeParseReturnType<unknown, unknown> = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw this.toBadRequest(result.error);
    }
    return result.data;
  }

  private toBadRequest(error: ZodError): BadRequestException {
    return new BadRequestException({
      message: 'Validation failed',
      code: APP_CONSTANTS.ERROR_CODES.VALIDATION,
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
  }
}
