import request from 'supertest';
import type { App } from 'supertest/types';

import { bootstrapE2E, teardownE2E, type E2EContext } from './helpers/bootstrap';

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb('Auth (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
  });

  afterAll(async () => {
    await teardownE2E(ctx);
  });

  it('POST /api/v1/auth/register creates a user and returns tokens', async () => {
    const response = await request(ctx.app.getHttpServer() as unknown as App)
      .post('/api/v1/auth/register')
      .send({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('tokens.accessToken');
    expect(response.body.data).toHaveProperty('tokens.refreshToken');
    expect(response.body.data.user.email).toBe('newuser@example.com');
  });

  it('POST /api/v1/auth/login fails with invalid credentials', async () => {
    const response = await request(ctx.app.getHttpServer() as unknown as App)
      .post('/api/v1/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'wrong-password',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(401);
  });

  it('GET /api/v1/auth/me without token returns 401', async () => {
    const response = await request(ctx.app.getHttpServer() as unknown as App).get(
      '/api/v1/auth/me',
    );

    expect(response.status).toBe(401);
  });
});
