import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorOptions {
  code?: string;
  details?: unknown;
  cause?: unknown;
}

export class DomainException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(status: HttpStatus, message: string, options: ErrorOptions = {}) {
    super({ statusCode: status, message, code: options.code, details: options.details }, status);
    this.errorCode = options.code ?? 'DOMAIN_ERROR';
    this.details = options.details;
    this.cause = options.cause;
  }
}

export class NotFoundDomainException extends DomainException {
  constructor(resource: string, identifier?: string | number) {
    super(HttpStatus.NOT_FOUND, `${resource}${identifier ? ` (${identifier})` : ''} not found`, {
      code: 'NOT_FOUND',
      details: { resource, identifier },
    });
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message: string, code = 'CONFLICT', details?: unknown) {
    super(HttpStatus.CONFLICT, message, { code, details });
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(HttpStatus.UNAUTHORIZED, message, { code });
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(HttpStatus.FORBIDDEN, message, { code });
  }
}

export class BadRequestDomainException extends DomainException {
  constructor(message: string, code = 'BAD_REQUEST', details?: unknown) {
    super(HttpStatus.BAD_REQUEST, message, { code, details });
  }
}

export class UnprocessableEntityDomainException extends DomainException {
  constructor(message: string, code = 'UNPROCESSABLE_ENTITY', details?: unknown) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, { code, details });
  }
}

export class TooManyRequestsDomainException extends DomainException {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
    super(HttpStatus.TOO_MANY_REQUESTS, message, { code });
  }
}
