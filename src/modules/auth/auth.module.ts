import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<string>('auth.jwtAccessExpiresIn') ?? '15m') as `${number}${'s' | 'm' | 'h'}`;
        return {
          secret: config.get<string>('auth.jwtSecret'),
          signOptions: { expiresIn },
        };
      },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule, JwtStrategy],
})
export class AuthModule {}
