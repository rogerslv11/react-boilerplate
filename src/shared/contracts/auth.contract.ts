export interface JwtPayload {
  sub: string;
  email?: string;
  role?: 'user' | 'admin';
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface RequestUser extends AuthenticatedUser {
  refreshTokenId?: string;
}
