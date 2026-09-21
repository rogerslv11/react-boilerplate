import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import appConfig, { type AppConfig } from '@/config/app.config';
import authConfig from '@/config/auth.config';
import databaseConfig from '@/config/database.config';
import { validateEnv } from '@/config/env.schema';

import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from '@/common/interceptors/response-transform.interceptor';
import { RequestIdMiddleware } from '@/common/middleware/request-id.middleware';
import { AppLogger } from '@/common/logger/app.logger';

import { DatabaseModule } from '@/database/database.module';

import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env.local', '.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.getOrThrow<AppConfig>('app');
        return AppLogger.forRoot({
          level: process.env.LOG_LEVEL ?? (app.isProduction ? 'info' : 'debug'),
          isProduction: app.isProduction,
        });
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('THROTTLE_TTL', 60)) * 1000,
          limit: Number(configService.get('THROTTLE_LIMIT', 100)),
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
