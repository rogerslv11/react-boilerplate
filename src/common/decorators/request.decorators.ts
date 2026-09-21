import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { RequestUser } from '@/shared/contracts/auth.contract';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    return request.user;
  },
);

export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ id?: string }>();
    return request.id;
  },
);

export const IpAddress = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ ip?: string }>();
    return request.ip;
  },
);
