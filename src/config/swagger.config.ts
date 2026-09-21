import { registerAs } from '@nestjs/config';
import type { EnvSchema } from './env.schema';

export type ThrottleConfig = {
  ttl: number;
  limit: number;
};

export const throttleConfig = registerAs(
  'throttle',
  (): ThrottleConfig => ({
    ttl: Number(process.env.THROTTLE_TTL ?? 60),
    limit: Number(process.env.THROTTLE_LIMIT ?? 120),
  }),
);

export type SwaggerConfig = {
  enabled: boolean;
  path: string;
  title: string;
  description: string;
  version: string;
};

export const swaggerConfig = registerAs(
  'swagger',
  (): SwaggerConfig => ({
    enabled: (process.env.SWAGGER_ENABLED ?? 'true') === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
    title: process.env.SWAGGER_TITLE ?? 'NestJS Boilerplate API',
    description: process.env.SWAGGER_DESCRIPTION ?? 'Professional NestJS backend boilerplate',
    version: process.env.SWAGGER_VERSION ?? '1.0.0',
  }),
);

export type LogConfig = {
  level: EnvSchema['LOG_LEVEL'];
  pretty: boolean;
};

export const logConfig = registerAs(
  'log',
  (): LogConfig => ({
    level: (process.env.LOG_LEVEL as LogConfig['level']) ?? 'info',
    pretty: (process.env.LOG_PRETTY ?? 'false') === 'true',
  }),
);
