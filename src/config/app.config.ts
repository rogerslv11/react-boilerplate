import { registerAs } from '@nestjs/config';

function coerceNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function coerceBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return ['*'];
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseEnv(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  name: string;
  apiPrefix: string;
  apiVersion: number;
  corsOrigins: string[];
  docsEnabled: boolean;
  docsPath: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export default registerAs<AppConfig>('app', () => {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'];
  return {
    nodeEnv,
    port: coerceNumber(process.env.PORT, 3000),
    name: parseEnv(process.env.APP_NAME, 'NestJS Boilerplate'),
    apiPrefix: parseEnv(process.env.API_PREFIX, 'api/v1'),
    apiVersion: coerceNumber(process.env.API_VERSION, 1),
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
    docsEnabled: coerceBool(process.env.DOCS_ENABLED, true),
    docsPath: parseEnv(process.env.DOCS_PATH, 'docs'),
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
  };
});
