import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('API basics', () => {
  it('GET /health responds 200 and healthy payload', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });

  it('GET /owners responds 200 with list shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/owners' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('owners');
    expect(Array.isArray(body.owners)).toBe(true);
    expect(body).toHaveProperty('pagination');
  });
});
