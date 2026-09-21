import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AuthConfig } from '@/config/auth.config';
import { UsersModule } from '@/modules/users/users.module';

import { AuthController } from './auth.controller';
import { RefreshToken } from './refresh-token.entity';
import { AuthService, RefreshTokenService, TokenService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const auth = configService.getOrThrow<AuthConfig>('auth');
        return {
          secret: auth.jwtSecret,
          signOptions: { expiresIn: auth.jwtAccessTtl as `${number}${'s' | 'm' | 'h' | 'd'}` },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    {
      provide: TokenService,
      inject: [JwtService, ConfigService],
      useFactory: (jwtService: JwtService, configService: ConfigService) => {
        const auth = configService.getOrThrow<AuthConfig>('auth');
        return new TokenService(jwtService, {
          accessSecret: auth.jwtSecret,
          accessTtl: auth.jwtAccessTtl,
          refreshSecret: auth.jwtRefreshSecret,
          refreshTtl: auth.jwtRefreshTtl,
        });
      },
    },
    JwtStrategy,
  ],
  exports: [AuthService, TokenService, RefreshTokenService],
})
export class AuthModule {}
