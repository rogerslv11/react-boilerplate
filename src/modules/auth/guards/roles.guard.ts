import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ForbiddenDomainException } from '@/common/exceptions/domain.exceptions';
import type { RequestUser } from '@/shared/contracts/auth.contract';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@/modules/users/users.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();

    if (!request.user) {
      throw new ForbiddenDomainException('Authentication required', 'UNAUTHENTICATED');
    }

    const userRole = request.user.role;
    if (!userRole || !required.includes(userRole)) {
      throw new ForbiddenDomainException('Insufficient permissions', 'INSUFFICIENT_ROLE');
    }

    return true;
  }
}
