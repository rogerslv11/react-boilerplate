import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';

import type { AppConfig } from '@/config/app.config';
import { setupSwagger } from '@/config/swagger.config';
import { AppModule } from '@/app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
    abortOnError: false,
  });

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: appConfig.corsOrigins.includes('*') ? true : appConfig.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.useGlobalPipes(new ZodValidationPipe());

  setupSwagger(app, appConfig);

  app.enableShutdownHooks();

  await app.listen(appConfig.port);

  logger.log(
    `🚀 ${appConfig.name} running on http://localhost:${appConfig.port}/${appConfig.apiPrefix}`,
  );
  logger.log(`📚 Swagger docs: http://localhost:${appConfig.port}/${appConfig.docsPath}`);
  logger.log(`🌍 Environment: ${appConfig.nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
