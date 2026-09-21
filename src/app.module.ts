import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import {
  appConfig,
  authConfig,
  databaseConfig,
  logConfig,
  swaggerConfig,
  throttleConfig,
} from './config/configuration';
import { GlobalExceptionFilter } from './common/filters';
import { ResponseInterceptor } from './common/interceptors';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, authConfig, databaseConfig, logConfig, swaggerConfig, throttleConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const pretty = (process.env.LOG_PRETTY ?? 'false') === 'true';
        const level = process.env.LOG_LEVEL ?? 'info';
        return {
          pinoHttp: {
            level,
            transport: pretty
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                }
              : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.currentPassword',
                'req.body.newPassword',
              ],
              remove: false,
            },
            customProps: () => ({ context: 'HTTP' }),
            autoLogging: true,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
          limit: Number(process.env.THROTTLE_LIMIT ?? 120),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
