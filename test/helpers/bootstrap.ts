import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '@/app.module';

export interface E2EContext {
  app: INestApplication;
  dataSource: DataSource;
}

export async function bootstrapE2E(): Promise<E2EContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  app.setGlobalPrefix(apiPrefix);

  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

export async function teardownE2E(ctx: E2EContext): Promise<void> {
  await ctx.app.close();
}
