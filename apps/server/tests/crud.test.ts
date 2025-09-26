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

describe('Owners CRUD (mock)', () => {
  let createdId: string;

  it('POST /owners creates an owner', async () => {
    const payload = {
      name: 'Alice Operator',
      email: 'alice@example.com',
      walletAddress: '0xabc',
      tier: 'basic',
      preferences: {
        notifications: { email: true, sms: false, push: true },
        alertThresholds: { utilizationLow: 10, utilizationHigh: 90 },
      },
    };
    const res = await app.inject({ method: 'POST', url: '/owners', payload });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body.email).toBe(payload.email);
    createdId = body.id;
  });

  it('GET /owners/:id returns an owner', async () => {
    const res = await app.inject({ method: 'GET', url: `/owners/${createdId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', createdId);
  });

  it('PUT /owners/:id updates an owner (mocked)', async () => {
    const res = await app.inject({ method: 'PUT', url: `/owners/${createdId}`, payload: { name: 'Alice Updated' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', createdId);
  });

  it('DELETE /owners/:id deletes an owner (mocked)', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/owners/${createdId}` });
    expect(res.statusCode).toBe(204);
  });
});

describe('Devices CRUD (mock)', () => {
  let createdId: string;

  const baseDevice = {
    ownerId: '1',
    name: 'GPU Worker One',
    type: 'gpu' as const,
    specifications: { model: 'NVIDIA RTX 4090', memory: '24GB' },
    location: { country: 'USA', region: 'CA', datacenter: 'SF-01' },
    pricing: { hourlyRate: 2.5, currency: 'USD' },
    status: 'online' as const,
  };

  it('POST /devices creates a device', async () => {
    const res = await app.inject({ method: 'POST', url: '/devices', payload: baseDevice });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('ownerId', baseDevice.ownerId);
    createdId = body.id;
  });

  it('GET /devices/:id returns a device', async () => {
    const res = await app.inject({ method: 'GET', url: `/devices/${createdId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', createdId);
  });

  it('PUT /devices/:id updates a device pricing (mocked)', async () => {
    const res = await app.inject({ method: 'PUT', url: `/devices/${createdId}`, payload: { pricing: { hourlyRate: 2.75 } } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('id', createdId);
  });

  it('DELETE /devices/:id deletes a device (mocked)', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/devices/${createdId}` });
    expect(res.statusCode).toBe(204);
  });
});

