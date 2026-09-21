import type { User, UserRole, UserStatus } from '@prisma/client';
import type { UserResponse } from '../schemas';

export type AuthenticatedUser = Pick<UserResponse, 'id' | 'email' | 'name' | 'role' | 'status'>;

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type UserWithPassword = User;
