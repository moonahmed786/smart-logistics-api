import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/main';

const README_BODY = {
  edges: [
    { from: 'A', to: 'B', cost: 10 },
    { from: 'A', to: 'C', cost: 5 },
    { from: 'B', to: 'D', cost: 8 },
    { from: 'C', to: 'D', cost: 12 },
    { from: 'D', to: 'E', cost: 12 },
    { from: 'D', to: 'F', cost: 4 },
    { from: 'F', to: 'G', cost: 4 },
    { from: 'E', to: 'G', cost: 9 },
    { from: 'C', to: 'H', cost: 8 },
    { from: 'D', to: 'H', cost: 4 },
    { from: 'F', to: 'H', cost: 1 },
  ],
};

describe('Smart Logistics Routing API (e2e)', () => {
  let app: NestFastifyApplication;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    process.env.LOG_LEVEL = 'silent';
    process.env.RATE_LIMIT_MAX = '10000';
    delete process.env.API_KEY;
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it('uploads a graph and lists its nodes', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: README_BODY,
    });
    expect(upload.statusCode).toBe(201);
    const { id, nodeCount, edgeCount } = JSON.parse(upload.payload);
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(nodeCount).toBe(8);
    expect(edgeCount).toBe(11);

    const nodes = await app.inject({ method: 'GET', url: `/network/nodes/${id}` });
    expect(nodes.statusCode).toBe(200);
    const body = JSON.parse(nodes.payload);
    expect(body.graphId).toBe(id);
    expect(body.nodes.map((n: { id: string }) => n.id).sort()).toEqual(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    );
  });

  it('optimizes a route through the README graph (HTTP 200)', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: README_BODY,
    });
    const { id } = JSON.parse(upload.payload);

    const optimize = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'E' },
    });
    expect(optimize.statusCode).toBe(200);
    const body = JSON.parse(optimize.payload);
    expect(body.graphId).toBe(id);
    expect(body.totalCost).toBe(27);
    expect(body.path).toEqual(['A', 'C', 'H', 'F', 'G', 'E']);
    expect(body.preference).toBe('shortest');
    expect(typeof body.durationMs).toBe('number');
  });

  it('returns 400 with structured error envelope for malformed body', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: { edges: [{ from: 'A', to: 'B' }] },
    });
    expect(r.statusCode).toBe(400);
    const body = JSON.parse(r.payload);
    expect(body).toMatchObject({
      statusCode: 400,
      code: expect.any(String),
      message: expect.any(String),
      path: '/network/upload',
    });
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects NaN/Infinity costs (DTO validation)', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: { edges: [{ from: 'A', to: 'B', cost: Number.POSITIVE_INFINITY }] },
    });
    expect(r.statusCode).toBe(400);
  });

  it('returns 404 with envelope for unknown graph id on optimize', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/route/optimize/00000000-0000-0000-0000-000000000000',
      payload: { originNodeId: 'A', destinationNodeId: 'B' },
    });
    expect(r.statusCode).toBe(404);
    const body = JSON.parse(r.payload);
    expect(body.statusCode).toBe(404);
    expect(body.message).toMatch(/Graph not found/);
  });

  it('preference switching: "fastest" picks duration-optimal path, not cost-optimal', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: {
        edges: [
          { from: 'A', to: 'B', cost: 1, durationMinutes: 60 },
          { from: 'B', to: 'C', cost: 1, durationMinutes: 60 },
          { from: 'A', to: 'C', cost: 10, durationMinutes: 5 },
        ],
      },
    });
    const { id } = JSON.parse(upload.payload);

    const shortest = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'C', preference: 'shortest' },
    });
    expect(shortest.statusCode).toBe(200);
    expect(JSON.parse(shortest.payload)).toMatchObject({
      totalCost: 2,
      path: ['A', 'B', 'C'],
      preference: 'shortest',
    });

    const fastest = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'C', preference: 'fastest' },
    });
    expect(fastest.statusCode).toBe(200);
    expect(JSON.parse(fastest.payload)).toMatchObject({
      totalCost: 5,
      path: ['A', 'C'],
      preference: 'fastest',
    });
  });

  it('constraint filtering: avoidHighways=true forces a longer compliant route', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: {
        edges: [
          { from: 'A', to: 'B', cost: 1, tags: ['highway'] },
          { from: 'A', to: 'C', cost: 5 },
          { from: 'C', to: 'B', cost: 5 },
        ],
      },
    });
    const { id } = JSON.parse(upload.payload);

    const unconstrained = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'B' },
    });
    expect(JSON.parse(unconstrained.payload)).toMatchObject({ totalCost: 1, path: ['A', 'B'] });

    const noHighways = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: {
        originNodeId: 'A',
        destinationNodeId: 'B',
        constraints: { avoidHighways: true },
      },
    });
    expect(noHighways.statusCode).toBe(200);
    expect(JSON.parse(noHighways.payload)).toMatchObject({
      totalCost: 10,
      path: ['A', 'C', 'B'],
    });
  });

  it('error handling: 400 when origin/destination node is not in the graph', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: { edges: [{ from: 'A', to: 'B', cost: 1 }] },
    });
    const { id } = JSON.parse(upload.payload);

    const badOrigin = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'Z', destinationNodeId: 'B' },
    });
    expect(badOrigin.statusCode).toBe(400);
    expect(JSON.parse(badOrigin.payload).message).toMatch(/Node not found/);

    const badDest = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'Z' },
    });
    expect(badDest.statusCode).toBe(400);
    expect(JSON.parse(badDest.payload).message).toMatch(/Node not found/);
  });

  it('error handling: 404 when destination is unreachable', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: {
        edges: [
          { from: 'A', to: 'B', cost: 1 },
          { from: 'C', to: 'D', cost: 1 },
        ],
      },
    });
    const { id } = JSON.parse(upload.payload);

    const r = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'D' },
    });
    expect(r.statusCode).toBe(404);
    expect(JSON.parse(r.payload).message).toMatch(/No path from A to D/);
  });

  it('error handling: 400 when preference is not in the allowed enum', async () => {
    const upload = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: { edges: [{ from: 'A', to: 'B', cost: 1 }] },
    });
    const { id } = JSON.parse(upload.payload);

    const r = await app.inject({
      method: 'POST',
      url: `/route/optimize/${id}`,
      payload: { originNodeId: 'A', destinationNodeId: 'B', preference: 'cheapest' },
    });
    expect(r.statusCode).toBe(400);
  });

  it('serves Swagger UI at /docs', async () => {
    const r = await app.inject({ method: 'GET', url: '/docs' });
    expect(r.statusCode).toBe(200);
    expect(r.payload).toMatch(/swagger-ui/i);
  });

  it('exposes /healthz and /readyz', async () => {
    const health = await app.inject({ method: 'GET', url: '/healthz' });
    expect(health.statusCode).toBe(200);
    expect(JSON.parse(health.payload)).toMatchObject({ status: 'ok' });

    const ready = await app.inject({ method: 'GET', url: '/readyz' });
    expect(ready.statusCode).toBe(200);
    expect(JSON.parse(ready.payload)).toEqual({ status: 'ready' });
  });

  it('sets security headers from helmet', async () => {
    const r = await app.inject({ method: 'GET', url: '/healthz' });
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBeDefined();
  });

  it('exposes rate-limit headers', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: README_BODY,
    });
    expect(r.headers['x-ratelimit-limit']).toBeDefined();
    expect(r.headers['x-ratelimit-remaining']).toBeDefined();
  });
});

describe('API key authentication', () => {
  let app: NestFastifyApplication;
  let originalEnv: NodeJS.ProcessEnv;
  const KEY = 'test-secret-key';

  beforeAll(async () => {
    originalEnv = { ...process.env };
    process.env.LOG_LEVEL = 'silent';
    process.env.RATE_LIMIT_MAX = '10000';
    process.env.API_KEY = KEY;
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it('rejects requests without the API key', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: README_BODY,
    });
    expect(r.statusCode).toBe(401);
  });

  it('accepts requests with the correct API key', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: README_BODY,
      headers: { 'x-api-key': KEY },
    });
    expect(r.statusCode).toBe(201);
  });

  it('allows /healthz without the API key', async () => {
    const r = await app.inject({ method: 'GET', url: '/healthz' });
    expect(r.statusCode).toBe(200);
  });
});

describe('Rate limiting (5 req/s per IP)', () => {
  let app: NestFastifyApplication;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    process.env.LOG_LEVEL = 'silent';
    process.env.RATE_LIMIT_TTL_MS = '1000';
    process.env.RATE_LIMIT_MAX = '5';
    delete process.env.API_KEY;
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it('returns 429 on the 6th request within the same second', async () => {
    const fire = () =>
      app.inject({
        method: 'GET',
        url: '/readyz',
      });

    const first = await fire();
    expect(Number(first.headers['x-ratelimit-limit'])).toBe(5);

    const burst = await Promise.all([fire(), fire(), fire(), fire(), fire(), fire()]);
    const statuses = burst.map((r) => r.statusCode);
    const tooMany = statuses.filter((s) => s === 429).length;

    expect(tooMany).toBeGreaterThanOrEqual(1);
  });
});
