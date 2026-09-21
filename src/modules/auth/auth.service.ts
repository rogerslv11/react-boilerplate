import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UnauthorizedException } from '@/common/exceptions';
import { APP_CONSTANTS } from '@/shared/constants';
import { UsersService } from '@/modules/users/services/users.service';
import type { LoginInput, RefreshTokenInput, RegisterInput, TokenResponse } from './schemas/auth.schemas';
import type { JwtPayload } from './types';

interface TimeSpan {
  milliseconds: number;
  seconds: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterInput): Promise<TokenResponse> {
    const created = await this.users.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'USER',
      status: 'ACTIVE',
    });

    return this.issueTokens({
      sub: created.id,
      email: created.email,
      role: created.role,
    });
  }

  async login(input: LoginInput): Promise<TokenResponse> {
    const user = await this.users.findRawByEmail(input.email);
    if (!user || user.deletedAt) {
      // Same error on missing user and wrong password to avoid enumeration
      throw new UnauthorizedException(
        'Invalid credentials',
        APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active',
        APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      );
    }

    const valid = await argon2.verify(user.password, input.password);
    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
        APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      );
    }

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(input: RefreshTokenInput): Promise<TokenResponse> {
    const tokenHash = this.hash(input.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revoked ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt ||
      stored.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
        APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokens({
      sub: stored.userId,
      email: stored.user.email,
      role: stored.user.role,
    });
  }

  async me(userId: string) {
    return this.users.findById(userId);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken
      .updateMany({ where: { tokenHash, revoked: false }, data: { revoked: true } })
      .catch(() => {
        // Logging out a missing token is a no-op
      });
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------

  private async issueTokens(
    claims: Pick<JwtPayload, 'sub' | 'email' | 'role'>,
  ): Promise<TokenResponse> {
    const accessExpires = this.config.get<string>('auth.jwtAccessExpiresIn') ?? '15m';
    const refreshExpires = this.config.get<string>('auth.jwtRefreshExpiresIn') ?? '7d';
    const refreshMs = this.toTimeSpan(refreshExpires).milliseconds;

    const accessToken = await this.jwt.signAsync(claims, {
      expiresIn: accessExpires as `${number}${'s' | 'm' | 'h'}`,
    });
    const refreshTokenPlain = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.hash(refreshTokenPlain);

    await this.prisma.refreshToken.create({
      data: {
        userId: claims.sub,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshMs),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      tokenType: 'Bearer',
      expiresIn: this.toTimeSpan(accessExpires).seconds,
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toTimeSpan(value: string): TimeSpan {
    const match = /^(\d+)([smhdw])$/.exec(value);
    if (!match) {
      return { milliseconds: 15 * 60 * 1000, seconds: 15 * 60 };
    }
    const n = Number(match[1]);
    const unit = (match[2] ?? 'm') as 's' | 'm' | 'h' | 'd' | 'w';
    const map: Record<typeof unit, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
      w: 604_800_000,
    };
    const ms = n * map[unit];
    return { milliseconds: ms, seconds: Math.floor(ms / 1000) };
  }
}
