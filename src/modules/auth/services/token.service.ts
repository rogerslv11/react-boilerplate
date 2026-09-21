import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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

export interface TokenConfig {
  accessSecret: string;
  accessTtl: string;
  refreshSecret: string;
  refreshTtl: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: TokenConfig,
  ) {}

  get accessTtlSeconds(): number {
    return this.parseTtl(this.config.accessTtl);
  }

  get refreshTtlSeconds(): number {
    return this.parseTtl(this.config.refreshTtl);
  }

  signAccessToken(payload: AccessTokenPayload): { token: string; expiresIn: number } {
    const token = this.jwtService.sign({ ...payload, type: 'access' } satisfies JwtPayload, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
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
        secret: this.config.refreshSecret,
        expiresIn: this.config.refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    return { token, expiresIn: this.refreshTtlSeconds };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, { secret: this.config.accessSecret });
  }

  verifyRefreshToken(token: string): JwtPayload & { jti?: string } {
    return this.jwtService.verify<JwtPayload & { jti?: string }>(token, {
      secret: this.config.refreshSecret,
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
