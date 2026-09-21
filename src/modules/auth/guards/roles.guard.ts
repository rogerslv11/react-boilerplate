import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import type { AuthUser } from '@/common/decorators/user.decorator';
import { APP_CONSTANTS } from '@/shared/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user) {
      throw new ForbiddenException(
        'Authentication required',
        APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      );
    }

    const has = requiredRoles.includes(user.role as UserRole);
    if (!has) {
      throw new ForbiddenException(
        'Insufficient privileges to access this resource',
        APP_CONSTANTS.ERROR_CODES.FORBIDDEN,
      );
    }
    return true;
  }
}
