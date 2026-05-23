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

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
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

  it('optimizes a route through the README graph', async () => {
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
    expect(optimize.statusCode).toBe(201);
    const body = JSON.parse(optimize.payload);
    expect(body.graphId).toBe(id);
    expect(body.totalCost).toBe(27);
    expect(body.path).toEqual(['A', 'C', 'H', 'F', 'G', 'E']);
    expect(body.preference).toBe('shortest');
    expect(typeof body.durationMs).toBe('number');
  });

  it('returns 400 for malformed upload body', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/network/upload',
      payload: { edges: [{ from: 'A', to: 'B' }] },
    });
    expect(r.statusCode).toBe(400);
  });

  it('returns 404 for unknown graph id on optimize', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/route/optimize/00000000-0000-0000-0000-000000000000',
      payload: { originNodeId: 'A', destinationNodeId: 'B' },
    });
    expect(r.statusCode).toBe(404);
  });

  it('serves Swagger UI at /docs', async () => {
    const r = await app.inject({ method: 'GET', url: '/docs' });
    expect(r.statusCode).toBe(200);
    expect(r.payload).toMatch(/swagger-ui/i);
  });
});
