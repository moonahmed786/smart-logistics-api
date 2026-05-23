import { GraphNotFoundException } from '../../common/exceptions/graph-not-found.exception';
import { NodeNotFoundException } from '../../common/exceptions/node-not-found.exception';
import { UnreachableDestinationException } from '../../common/exceptions/unreachable-destination.exception';
import { InMemoryNetworkRepository } from '../../storage/in-memory.repository';
import { NetworkService } from '../network/network.service';
import { RouteService } from './route.service';

describe('RouteService', () => {
  let repo: InMemoryNetworkRepository;
  let network: NetworkService;
  let service: RouteService;

  beforeEach(() => {
    repo = new InMemoryNetworkRepository();
    network = new NetworkService(repo);
    service = new RouteService(repo);
  });

  it('404s on unknown graphId', async () => {
    await expect(
      service.optimize('missing', { originNodeId: 'A', destinationNodeId: 'B' }),
    ).rejects.toBeInstanceOf(GraphNotFoundException);
  });

  it('400s when origin is not in the graph', async () => {
    const { id } = await network.uploadNetwork({ edges: [{ from: 'A', to: 'B', cost: 1 }] });
    await expect(
      service.optimize(id, { originNodeId: 'Z', destinationNodeId: 'B' }),
    ).rejects.toBeInstanceOf(NodeNotFoundException);
  });

  it('400s when destination is not in the graph', async () => {
    const { id } = await network.uploadNetwork({ edges: [{ from: 'A', to: 'B', cost: 1 }] });
    await expect(
      service.optimize(id, { originNodeId: 'A', destinationNodeId: 'Z' }),
    ).rejects.toBeInstanceOf(NodeNotFoundException);
  });

  it('404s when destination is unreachable', async () => {
    const { id } = await network.uploadNetwork({
      edges: [
        { from: 'A', to: 'B', cost: 1 },
        { from: 'C', to: 'D', cost: 1 },
      ],
    });
    await expect(
      service.optimize(id, { originNodeId: 'A', destinationNodeId: 'D' }),
    ).rejects.toBeInstanceOf(UnreachableDestinationException);
  });

  it('short-circuits when origin === destination', async () => {
    const { id } = await network.uploadNetwork({ edges: [{ from: 'A', to: 'B', cost: 1 }] });
    const r = await service.optimize(id, { originNodeId: 'A', destinationNodeId: 'A' });
    expect(r).toMatchObject({ totalCost: 0, path: ['A'], durationMs: 0, preference: 'shortest' });
  });

  it('returns optimal path on happy path', async () => {
    const { id } = await network.uploadNetwork({
      edges: [
        { from: 'A', to: 'B', cost: 1 },
        { from: 'B', to: 'C', cost: 2 },
        { from: 'A', to: 'C', cost: 10 },
      ],
    });
    const r = await service.optimize(id, { originNodeId: 'A', destinationNodeId: 'C' });
    expect(r.totalCost).toBe(3);
    expect(r.path).toEqual(['A', 'B', 'C']);
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(r.preference).toBe('shortest');
  });

  it('honours avoidHighways constraint', async () => {
    const { id } = await network.uploadNetwork({
      edges: [
        { from: 'A', to: 'B', cost: 1, tags: ['highway'] },
        { from: 'A', to: 'C', cost: 5 },
        { from: 'C', to: 'B', cost: 5 },
      ],
    });
    const r = await service.optimize(id, {
      originNodeId: 'A',
      destinationNodeId: 'B',
      constraints: { avoidHighways: true },
    });
    expect(r.totalCost).toBe(10);
    expect(r.path).toEqual(['A', 'C', 'B']);
  });
});
