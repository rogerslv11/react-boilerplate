import { registerAs } from '@nestjs/config';
import type { EnvSchema } from './env.schema';

export type AppConfig = {
  nodeEnv: EnvSchema['NODE_ENV'];
  name: string;
  port: number;
  host: string;
  apiPrefix: string;
  apiVersion: string;
  apiGlobalPrefix: string;
  cors: {
    origin: string[] | string;
    credentials: boolean;
  };
};

export const appConfig = registerAs(
  'app',
  (): AppConfig => {
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    const apiVersion = process.env.API_VERSION ?? 'v1';
    const rawOrigin = process.env.CORS_ORIGIN ?? '*';
    const origin =
      rawOrigin === '*'
        ? '*'
        : rawOrigin
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);

    return {
      nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
      name: process.env.APP_NAME ?? 'nestjs-boilerplate',
      port: Number(process.env.PORT ?? 3000),
      host: process.env.HOST ?? '0.0.0.0',
      apiPrefix,
      apiVersion,
      apiGlobalPrefix: `${apiPrefix}/${apiVersion}`,
      cors: {
        origin,
        credentials: (process.env.CORS_CREDENTIALS ?? 'false') === 'true',
      },
    };
  },
);
