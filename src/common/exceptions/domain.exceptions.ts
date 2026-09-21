import { HttpException } from '@nestjs/common';
import { APP_CONSTANTS } from '../../shared/constants';

interface DomainExceptionOptions {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Base class for domain-level exceptions. Each subclass maps to a
 * specific HTTP status and adds a stable error code.
 */
export abstract class DomainException extends HttpException {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  protected constructor(status: number, options: DomainExceptionOptions) {
    super({ statusCode: status, message: options.message, code: options.code }, status);
    this.code = options.code ?? APP_CONSTANTS.ERROR_CODES.INTERNAL;
    if (options.details) {
      this.details = options.details;
    }
  }
}

export class NotFoundException extends DomainException {
  constructor(message = 'Resource not found', code?: string, details?: Record<string, unknown>) {
    super(404, { message, code: code ?? APP_CONSTANTS.ERROR_CODES.NOT_FOUND, details });
  }
}

export class ConflictException extends DomainException {
  constructor(message = 'Resource already exists', code?: string, details?: Record<string, unknown>) {
    super(409, { message, code: code ?? APP_CONSTANTS.ERROR_CODES.CONFLICT, details });
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized', code?: string, details?: Record<string, unknown>) {
    super(401, { message, code: code ?? APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED, details });
  }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'Forbidden', code?: string, details?: Record<string, unknown>) {
    super(403, { message, code: code ?? APP_CONSTANTS.ERROR_CODES.FORBIDDEN, details });
  }
}

export class BadRequestException extends DomainException {
  constructor(message = 'Bad request', code?: string, details?: Record<string, unknown>) {
    super(400, { message, code: code ?? APP_CONSTANTS.ERROR_CODES.BAD_REQUEST, details });
  }
}
