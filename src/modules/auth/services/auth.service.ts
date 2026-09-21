import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import {
  UnauthorizedDomainException,
  ConflictDomainException,
} from '@/common/exceptions/domain.exceptions';
import { UsersService } from '@/modules/users/users.service';
import { toUserView } from '@/modules/users/interfaces/user-view';
import { UsersRepository } from '@/modules/users/users.repository';
import type { User } from '@/modules/users/users.entity';

import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';
import { LoginInput, RegisterInput } from '../schemas/auth.schemas';

export interface AuthContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface TokenPairResponse {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  user: ReturnType<typeof toUserView>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(input: RegisterInput, context: AuthContext): Promise<TokenPairResponse> {
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictDomainException('Email already in use', 'EMAIL_ALREADY_EXISTS', {
        email: input.email,
      });
    }

    const userView = await this.usersService.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'user',
    });

    const createdUser = await this.usersRepository.findById(userView.id);
    if (!createdUser) {
      throw new UnauthorizedDomainException(
        'Failed to load newly created user',
        'USER_LOOKUP_FAILED',
      );
    }

    return this.issueTokens(createdUser, context);
  }

  async login(input: LoginInput, context: AuthContext): Promise<TokenPairResponse> {
    const user = await this.usersRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedDomainException('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedDomainException('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    await this.usersService.markLoggedIn(user.id);
    return this.issueTokens(user, context);
  }

  async refresh(
    userId: string,
    refreshToken: string,
    context: AuthContext,
  ): Promise<TokenPairResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedDomainException('User not active', 'USER_NOT_ACTIVE');
    }

    const next = await this.refreshTokenService.rotate({
      oldToken: refreshToken,
      userId,
      context,
    });

    const access = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: access.token,
      accessExpiresIn: access.expiresIn,
      refreshToken: next.token,
      refreshExpiresIn: next.expiresIn,
      user: toUserView(user),
    };
  }

  async logout(userId: string, refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenService.revoke(refreshToken);
    } else {
      await this.refreshTokenService.revokeAllForUser(userId);
    }
  }

  private async issueTokens(user: User, context: AuthContext): Promise<TokenPairResponse> {
    const access = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refresh = await this.refreshTokenService.issue(user.id, context);
    return {
      accessToken: access.token,
      accessExpiresIn: access.expiresIn,
      refreshToken: refresh.token,
      refreshExpiresIn: refresh.expiresIn,
      user: toUserView(user),
    };
  }
}
