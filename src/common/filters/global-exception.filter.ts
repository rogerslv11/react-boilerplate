import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { APP_CONSTANTS } from '../../shared/constants';
import type { ApiErrorDetail, ApiErrorResponse } from '../../shared/types';
import { DomainException } from '../exceptions/domain.exceptions';
import { getRequestId } from '../utils/request-id.util';

interface ExceptionWithCode {
  code?: string;
  message?: string;
  status?: number;
  response?: {
    code?: string;
    message?: string | string[];
    error?: string;
    statusCode?: number;
  };
}

/**
 * Global exception filter — converts any thrown error into a consistent
 * JSON response. It also logs unhandled errors and avoids leaking
 * stack traces or internal details to clients.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = getRequestId(request);

    const payload = this.buildPayload(exception, request, requestId);

    if (payload.statusCode >= 500) {
      this.logger.error(
        {
          requestId,
          method: request.method,
          path: request.originalUrl,
          error: exception instanceof Error ? exception.stack : String(exception),
        },
        `${payload.statusCode} ${payload.error}: ${payload.message}`,
      );
    } else if (payload.statusCode >= 400) {
      this.logger.warn({
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: payload.statusCode,
        message: payload.message,
      });
    }

    response.status(payload.statusCode).json(payload);
  }

  private buildPayload(exception: unknown, request: Request, requestId: string): ApiErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.originalUrl ?? request.url;

    // Domain exceptions — already well-structured
    if (exception instanceof DomainException) {
      const body = exception.getResponse() as { message?: string; code?: string };
      return {
        success: false,
        statusCode: exception.getStatus(),
        error: this.httpStatusName(exception.getStatus()),
        message: typeof body.message === 'string' ? body.message : exception.message,
        ...(body.code ? { code: body.code } : {}),
        path,
        timestamp,
        requestId,
      };
    }

    // NestJS HTTP exceptions (NotFoundException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as ExceptionWithCode['response'] & {
        errors?: ApiErrorDetail[];
      };
      const message =
        (typeof body?.message === 'string' && body.message) ||
        (Array.isArray(body?.message) ? body.message.join('; ') : exception.message);
      const code =
        (body?.code) ?? this.codeFromStatus(status);
      const errors = Array.isArray(body?.errors)
        ? (body.errors)
        : undefined;

      return {
        success: false,
        statusCode: status,
        error: this.httpStatusName(status),
        message,
        ...(code ? { code } : {}),
        ...(errors ? { errors } : {}),
        path,
        timestamp,
        requestId,
      };
    }

    // Zod validation errors (when they escape the pipe as exceptions)
    if (exception instanceof ZodError) {
      const details: ApiErrorDetail[] = exception.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: this.httpStatusName(HttpStatus.BAD_REQUEST),
        message: 'Validation failed',
        errors: details,
        code: APP_CONSTANTS.ERROR_CODES.VALIDATION,
        path,
        timestamp,
        requestId,
      };
    }

    // Prisma known errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, message, code } = this.mapPrismaError(exception);
      return {
        success: false,
        statusCode: status,
        error: this.httpStatusName(status),
        message,
        code,
        path,
        timestamp,
        requestId,
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: this.httpStatusName(HttpStatus.BAD_REQUEST),
        message: 'Invalid database operation',
        code: APP_CONSTANTS.ERROR_CODES.BAD_REQUEST,
        path,
        timestamp,
        requestId,
      };
    }

    // Unhandled error
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      success: false,
      statusCode: status,
      error: this.httpStatusName(status),
      message: isProduction ? 'Internal server error' : (exception as Error)?.message ?? 'Internal server error',
      code: APP_CONSTANTS.ERROR_CODES.INTERNAL,
      path,
      timestamp,
      requestId,
    };
  }

  private mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (err.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with the same unique value already exists',
          code: APP_CONSTANTS.ERROR_CODES.CONFLICT,
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: APP_CONSTANTS.ERROR_CODES.NOT_FOUND,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint violation',
          code: APP_CONSTANTS.ERROR_CODES.BAD_REQUEST,
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Database error',
          code: APP_CONSTANTS.ERROR_CODES.BAD_REQUEST,
        };
    }
  }

  private httpStatusName(status: number): string {
    const entry = (Object.entries(HttpStatus) as Array<[string, number]>).find(([, v]) => v === status);
    return entry ? entry[0] : 'ERROR';
  }

  private codeFromStatus(status: number): string | undefined {
    const map: Record<number, string> = {
      400: APP_CONSTANTS.ERROR_CODES.BAD_REQUEST,
      401: APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      403: APP_CONSTANTS.ERROR_CODES.FORBIDDEN,
      404: APP_CONSTANTS.ERROR_CODES.NOT_FOUND,
      409: APP_CONSTANTS.ERROR_CODES.CONFLICT,
      429: APP_CONSTANTS.ERROR_CODES.THROTTLE,
    };
    return map[status];
  }
}
