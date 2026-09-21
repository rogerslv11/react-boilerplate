import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ApiZodBody, ApiZodResponse } from '@/common/decorators/zod-swagger.decorators';
import { CurrentUser, type AuthUser } from '@/common/decorators/user.decorator';
import { AuthService } from './auth.service';
import {
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  TokenResponseSchema,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
  type TokenResponse,
} from './schemas';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiZodBody({ schema: RegisterSchema, description: 'Registration payload' })
  @ApiZodResponse({ schema: TokenResponseSchema, status: 201, description: 'Newly created user tokens' })
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput,
  ): Promise<TokenResponse> {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and obtain an access + refresh token pair' })
  @ApiZodBody({ schema: LoginSchema })
  @ApiZodResponse({ schema: TokenResponseSchema, description: 'Bearer tokens' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
  ): Promise<TokenResponse> {
    return this.authService.login(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh token to obtain a fresh access token' })
  @ApiZodBody({ schema: RefreshTokenSchema })
  @ApiZodResponse({ schema: TokenResponseSchema })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<TokenResponse> {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Revoke a refresh token (logout)' })
  @ApiZodBody({ schema: RefreshTokenSchema })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<void> {
    await this.authService.logout(body.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.sub);
  }
}
