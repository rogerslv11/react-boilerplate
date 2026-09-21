import { registerAs } from '@nestjs/config';

function coerceNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function coerceBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function parseCookieSameSite(
  value: string | undefined,
  fallback: 'lax' | 'strict' | 'none',
): 'lax' | 'strict' | 'none' {
  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }
  return fallback;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtAccessTtl: string;
  jwtRefreshSecret: string;
  jwtRefreshTtl: string;
  bcryptRounds: number;
  refreshTokenCookie: boolean;
  refreshTokenCookieName: string;
  cookieSecure: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
}

export default registerAs<AuthConfig>('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  bcryptRounds: coerceNumber(process.env.BCRYPT_ROUNDS, 12),
  refreshTokenCookie: coerceBool(process.env.REFRESH_TOKEN_COOKIE, true),
  refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'rt',
  cookieSecure: coerceBool(process.env.COOKIE_SECURE, false),
  cookieSameSite: parseCookieSameSite(process.env.COOKIE_SAMESITE, 'lax'),
}));
