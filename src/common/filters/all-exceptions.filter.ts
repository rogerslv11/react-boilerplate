import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import type { Request, Response } from 'express';

import type { ErrorResponseBody } from '../contracts/response.contract';
import { DomainException } from '../exceptions/domain.exceptions';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();
    const requestId = request.id;

    const { status, body, errorMessage } = this.normalize(exception, request);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${errorMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} -> ${status} ${errorMessage}`);
    }

    const payload: ErrorResponseBody = {
      ...body,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    response.status(status).json(payload);
  }

  private normalize(
    exception: unknown,
    _request: Request,
  ): {
    status: number;
    body: Omit<ErrorResponseBody, 'requestId' | 'timestamp' | 'path'>;
    errorMessage: string;
  } {
    if (exception instanceof DomainException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as { message?: string; code?: string; details?: unknown };
      return {
        status,
        body: {
          statusCode: status,
          error: HttpStatus[status] ?? 'Error',
          code: exception.errorCode,
          message: res.message ?? exception.message,
          details: res.details,
        },
        errorMessage: res.message ?? exception.message,
      };
    }

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            issues:
              zodError instanceof ZodError
                ? zodError.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                  }))
                : zodError,
          },
        },
        errorMessage: 'Zod validation error',
      };
    }

    if (exception instanceof ZodError) {
      const status = HttpStatus.BAD_REQUEST;
      return {
        status,
        body: {
          statusCode: status,
          error: 'Bad Request',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            issues: exception.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
        },
        errorMessage: 'Zod validation error',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string }).message ?? exception.message);
      const code = (res as { code?: string }).code ?? this.defaultCode(status);
      return {
        status,
        body: {
          statusCode: status,
          error: HttpStatus[status] ?? 'Error',
          code,
          message: Array.isArray(message) ? 'Validation failed' : message,
          details: Array.isArray(message) ? { messages: message } : undefined,
        },
        errorMessage: Array.isArray(message) ? message.join('; ') : message,
      };
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const isProd = process.env.NODE_ENV === 'production';
    return {
      status,
      body: {
        statusCode: status,
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message: isProd
          ? 'An unexpected error occurred'
          : exception instanceof Error
            ? exception.message
            : 'Unknown error',
        details: isProd
          ? undefined
          : exception instanceof Error
            ? { name: exception.name, stack: exception.stack }
            : { value: exception },
      },
      errorMessage: exception instanceof Error ? exception.message : 'Unknown error',
    };
  }

  private defaultCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'ERROR';
    }
  }
}
