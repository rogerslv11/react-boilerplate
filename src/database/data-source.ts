import 'reflect-metadata';

import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { CreateRefreshTokensTable1700000001000 } from './migrations/1700000001000-CreateRefreshTokensTable';
import { CreateUsersTable1700000000000 } from './migrations/1700000000000-CreateUsersTable';
import { RefreshToken } from '../modules/auth/refresh-token.entity';
import { User } from '../modules/users/users.entity';

loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
loadEnv({ path: '.env' });

const isProd = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'nestjs_boilerplate',
  entities: [User, RefreshToken],
  migrations: [CreateUsersTable1700000000000, CreateRefreshTokensTable1700000001000],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: isProd ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
