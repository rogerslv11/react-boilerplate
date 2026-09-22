export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}
