import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AuthConfig } from '@/config/auth.config';
import type { JwtPayload } from '@/shared/contracts/auth.contract';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface IssuedTokens {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  refreshTokenId: string;
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    const auth = configService.getOrThrow<AuthConfig>('auth');
    this.accessSecret = auth.jwtSecret;
    this.refreshSecret = auth.jwtRefreshSecret;
    this.accessTtl = auth.jwtAccessTtl;
    this.refreshTtl = auth.jwtRefreshTtl;
  }

  get accessTtlSeconds(): number {
    return this.parseTtl(this.accessTtl);
  }

  get refreshTtlSeconds(): number {
    return this.parseTtl(this.refreshTtl);
  }

  signAccessToken(payload: AccessTokenPayload): { token: string; expiresIn: number } {
    const token = this.jwtService.sign({ ...payload, type: 'access' } satisfies JwtPayload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
    return { token, expiresIn: this.accessTtlSeconds };
  }

  signRefreshToken(payload: RefreshTokenPayload): { token: string; expiresIn: number } {
    const token = this.jwtService.sign(
      {
        sub: payload.sub,
        jti: payload.jti,
        type: 'refresh',
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    return { token, expiresIn: this.refreshTtlSeconds };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, { secret: this.accessSecret });
  }

  verifyRefreshToken(token: string): JwtPayload & { jti?: string } {
    return this.jwtService.verify<JwtPayload & { jti?: string }>(token, {
      secret: this.refreshSecret,
    });
  }

  private parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
      throw new Error(`Invalid TTL format: ${ttl}`);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }
}
