import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific user roles. Use together with the
 * `RolesGuard`.
 *
 * @example
 *   @Roles(UserRole.ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Delete(':id')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
