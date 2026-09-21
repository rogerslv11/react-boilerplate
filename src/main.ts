import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvSchema } from './config/env.schema';
import type { AppConfig, SwaggerConfig } from './config';

/**
 * Application bootstrap. Performs strict validation of environment
 * variables, wires HTTP hardening middleware (helmet/compression/
 * cookie parser), configures global validation pipes, sets up Swagger
 * when enabled, and listens on the configured host:port with
 * graceful shutdown support.
 */
async function bootstrap(): Promise<void> {
  // 1. Validate environment — fail fast if anything is missing/invalid.
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
     
    console.error(`\nInvalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  const env = parsed.data;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('app')!;
  const swaggerConfig = config.get<SwaggerConfig>('swagger')!;

  // 2. Trust proxy for accurate client IPs behind a load balancer.
  app.set('trust proxy', 1);

  // 3. Per-request correlation id (honors x-request-id when provided).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const existing = req.headers['x-request-id'];
    const header =
      typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
    req.headers['x-request-id'] = header;
    res.setHeader('x-request-id', header);
    next();
  });

  // 4. Hardening middleware.
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // 5. CORS.
  app.enableCors({
    origin: appConfig.cors.origin,
    credentials: appConfig.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  // 6. Global prefix + versioned routes.
  app.setGlobalPrefix(appConfig.apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConfig.apiVersion,
  });

  // 7. Swagger / OpenAPI.
  if (swaggerConfig.enabled) {
    const documentBuilder = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization',
          description: 'Paste a JWT access token (e.g. "eyJhbGciOi...")',
        },
        'bearer',
      )
      .addServer(`http://localhost:${appConfig.port}`, 'Local development')
      .build();

    const document = SwaggerModule.createDocument(app, documentBuilder);
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // 8. Graceful shutdown.
  app.enableShutdownHooks();

  // 9. Start the HTTP server.
  await app.listen(appConfig.port, appConfig.host);

  // eslint-disable-next-line no-console
  console.log(`🚀 ${appConfig.name} ready at http://${appConfig.host}:${appConfig.port}/${appConfig.apiPrefix}/${appConfig.apiVersion}`);
  if (swaggerConfig.enabled) {
    // eslint-disable-next-line no-console
    console.log(`📘 Docs: http://localhost:${appConfig.port}/${swaggerConfig.path}`);
  }
}

bootstrap().catch((error) => {
   
  console.error('Fatal error during application bootstrap:', error);
  process.exit(1);
});
