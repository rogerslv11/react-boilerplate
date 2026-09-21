import { registerAs } from '@nestjs/config';

export type AuthConfig = {
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
};

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters long');
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters long');
    }

    return {
      jwtSecret: secret,
      jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      jwtRefreshSecret: refreshSecret,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    };
  },
);
