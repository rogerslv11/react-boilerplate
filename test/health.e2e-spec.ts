import request from 'supertest';
import type { App } from 'supertest/types';

import { bootstrapE2E, teardownE2E, type E2EContext } from './helpers/bootstrap';

describe('Health (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
  });

  afterAll(async () => {
    await teardownE2E(ctx);
  });

  it('GET /api/v1/health returns ok or degraded with db status', async () => {
    const response = await request(ctx.app.getHttpServer() as unknown as App).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(['ok', 'degraded']).toContain(response.body.data.status);
    expect(response.body.data).toHaveProperty('database');
    expect(['up', 'down']).toContain(response.body.data.database.status);
  });
});
