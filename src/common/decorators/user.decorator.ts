import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { REQUEST_ID_HEADER } from '../utils/request-id.util';

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Convenience decorator to extract the current authenticated user
 * attached to the request by the JWT strategy/guard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return request.user as AuthUser;
  },
);

/**
 * Convenience decorator to extract the correlation/request id.
 */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const value = request.headers[REQUEST_ID_HEADER];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value[0]) return value[0];
    return 'system';
  },
);
