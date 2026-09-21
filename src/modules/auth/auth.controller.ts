import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CurrentUser } from '@/common/decorators/request.decorators';
import {
  BadRequestDomainException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exceptions';
import type { RequestUser } from '@/shared/contracts/auth.contract';

import { LoginResponseDto, RegisterResponseDto, AuthenticatedUserDto } from './dto';
import { AuthService, RefreshTokenService, type AuthContext } from './services';
import { refreshSchema, LoginDto, RefreshDto, RegisterDto } from './schemas/auth.schemas';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersRepository } from '@/modules/users/users.repository';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponseDto> {
    const ctx = this.extractContext(req);
    const result = await this.authService.register(body, ctx);
    this.setRefreshCookie(res, result.refreshToken);
    return this.toResponse(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const ctx = this.extractContext(req);
    const result = await this.authService.login(body, ctx);
    this.setRefreshCookie(res, result.refreshToken);
    return this.toResponse(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiOperation({ summary: 'Refresh tokens using a valid refresh token' })
  async refresh(
    @Body() body: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const token = body.refreshToken ?? this.readRefreshCookie(req);
    if (!token) {
      throw new BadRequestDomainException('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    const userId = this.refreshTokenService.verifyAndExtractUserId(token);
    const ctx = this.extractContext(req);
    const result = await this.authService.refresh(userId, token, ctx);
    this.setRefreshCookie(res, result.refreshToken);
    return this.toResponse(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout and revoke refresh token(s)' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    const parsed = refreshSchema.safeParse(req.body ?? {});
    const token = parsed.success ? parsed.data.refreshToken : undefined;
    const refreshToken = token ?? this.readRefreshCookie(req);
    await this.authService.logout(user.id, refreshToken);
    if (this.refreshTokenService.useCookie) {
      res.clearCookie(this.refreshTokenService.cookieName, {
        path: '/',
        httpOnly: true,
        secure: this.refreshTokenService.cookieSecureFlag,
        sameSite: this.refreshTokenService.cookieSameSiteFlag,
      });
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: AuthenticatedUserDto })
  @ApiOperation({ summary: 'Return currently authenticated user' })
  async me(@CurrentUser() user: RequestUser): Promise<AuthenticatedUserDto> {
    if (!user.role) {
      throw new UnauthorizedDomainException('Incomplete authentication context');
    }
    const dbUser = await this.usersRepository.findById(user.id);
    return {
      id: user.id,
      email: user.email,
      name: dbUser?.name ?? '',
      role: user.role,
    };
  }

  private extractContext(req: Request): AuthContext {
    return {
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      ipAddress: req.ip ?? null,
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    if (!this.refreshTokenService.useCookie) {
      return;
    }
    res.cookie(
      this.refreshTokenService.cookieName,
      token,
      this.refreshTokenService.buildCookieOptions(),
    );
  }

  private readRefreshCookie(req: Request): string | undefined {
    if (!this.refreshTokenService.useCookie) {
      return undefined;
    }
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    return cookies?.[this.refreshTokenService.cookieName];
  }

  private toResponse(result: Awaited<ReturnType<AuthService['register']>>): LoginResponseDto {
    return {
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessExpiresIn: result.accessExpiresIn,
        refreshExpiresIn: result.refreshExpiresIn,
        tokenType: 'Bearer',
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    };
  }
}
