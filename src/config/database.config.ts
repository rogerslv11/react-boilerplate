import { registerAs } from '@nestjs/config';
import type { EnvSchema } from './env.schema';

export type DatabaseConfig = {
  url: string;
  logLevel: EnvSchema['DATABASE_LOG_LEVEL'];
  poolSize: number;
};

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not configured');
    }
    return {
      url,
      logLevel: (process.env.DATABASE_LOG_LEVEL as DatabaseConfig['logLevel']) ?? 'warn',
      poolSize: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    };
  },
);
