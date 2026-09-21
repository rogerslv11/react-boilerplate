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

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
  synchronize: boolean;
  migrationsRun: boolean;
  poolMax: number;
}

export default registerAs<DatabaseConfig>('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: coerceNumber(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'nestjs_boilerplate',
  logging: coerceBool(process.env.DB_LOGGING, false),
  synchronize: coerceBool(process.env.DB_SYNCHRONIZE, false),
  migrationsRun: coerceBool(process.env.DB_MIGRATIONS_RUN, false),
  poolMax: coerceNumber(process.env.DB_POOL_MAX, 10),
}));
