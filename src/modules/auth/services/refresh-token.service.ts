import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthConfig } from '@/config/auth.config';
import { BadRequestDomainException } from '@/common/exceptions/domain.exceptions';

import { RefreshToken } from '../refresh-token.entity';
import { TokenService } from './token.service';

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenCookie: boolean;
  private readonly refreshTokenCookieName: string;
  private readonly cookieSecure: boolean;
  private readonly cookieSameSite: 'lax' | 'strict' | 'none';

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    const auth = configService.getOrThrow<AuthConfig>('auth');
    this.refreshTokenCookie = auth.refreshTokenCookie;
    this.refreshTokenCookieName = auth.refreshTokenCookieName;
    this.cookieSecure = auth.cookieSecure;
    this.cookieSameSite = auth.cookieSameSite;
  }

  get cookieName(): string {
    return this.refreshTokenCookieName;
  }

  get useCookie(): boolean {
    return this.refreshTokenCookie;
  }

  get cookieSecureFlag(): boolean {
    return this.cookieSecure;
  }

  get cookieSameSiteFlag(): 'lax' | 'strict' | 'none' {
    return this.cookieSameSite;
  }

  buildCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
  } {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.cookieSameSite,
      path: '/',
      maxAge: this.tokenService.refreshTtlSeconds * 1000,
    };
  }

  verifyAndExtractUserId(token: string): string {
    const decoded = this.jwtService.verify<{ sub: string }>(token);
    if (!decoded.sub) {
      throw new BadRequestDomainException('Invalid refresh token payload', 'INVALID_REFRESH_TOKEN');
    }
    return decoded.sub;
  }

  async issue(
    userId: string,
    context: { userAgent?: string | null; ipAddress?: string | null },
  ): Promise<{ token: string; expiresIn: number; tokenId: string }> {
    const tokenId = crypto.randomUUID();
    const token = crypto.randomBytes(64).toString('base64url');
    const tokenHash = this.hash(token);

    const expiresAt = new Date(Date.now() + this.tokenService.refreshTtlSeconds * 1000);

    await this.refreshTokens.save(
      this.refreshTokens.create({
        id: tokenId,
        userId,
        tokenHash,
        expiresAt,
        userAgent: context.userAgent ?? null,
        ipAddress: context.ipAddress ?? null,
        revokedAt: null,
        replacedBy: null,
      }),
    );

    return { token, expiresIn: this.tokenService.refreshTtlSeconds, tokenId };
  }

  async rotate(params: {
    oldToken: string;
    userId: string;
    context: { userAgent?: string | null; ipAddress?: string | null };
  }): Promise<{ token: string; expiresIn: number; tokenId: string }> {
    const oldHash = this.hash(params.oldToken);
    const stored = await this.refreshTokens.findOne({ where: { tokenHash: oldHash } });
    if (!stored) {
      throw new BadRequestDomainException('Refresh token not recognized', 'INVALID_REFRESH_TOKEN');
    }
    if (stored.userId !== params.userId) {
      throw new BadRequestDomainException('Refresh token mismatch', 'INVALID_REFRESH_TOKEN');
    }
    if (stored.revokedAt) {
      // Possible reuse attempt - revoke entire family chain.
      await this.revokeAllForUser(params.userId);
      throw new BadRequestDomainException('Refresh token already used', 'INVALID_REFRESH_TOKEN');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new BadRequestDomainException('Refresh token expired', 'INVALID_REFRESH_TOKEN');
    }

    const next = await this.issue(params.userId, params.context);
    stored.revokedAt = new Date();
    stored.replacedBy = next.tokenId;
    await this.refreshTokens.save(stored);
    return next;
  }

  async revoke(token: string): Promise<void> {
    const hash = this.hash(token);
    await this.refreshTokens.update({ tokenHash: hash }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
