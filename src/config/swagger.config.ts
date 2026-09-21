import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfig } from './app.config';

export function setupSwagger(app: INestApplication, appConfig: AppConfig): void {
  if (!appConfig.docsEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle(appConfig.name)
    .setDescription(
      `Professional NestJS boilerplate API.\n\n` +
        `All endpoints are prefixed with \`/${appConfig.apiPrefix}\`.\n` +
        `Authentication uses Bearer JWT access tokens.`,
    )
    .setVersion(String(appConfig.apiVersion))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('health', 'Service health and readiness probes')
    .addTag('auth', 'Authentication and session management')
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(appConfig.docsPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
}
