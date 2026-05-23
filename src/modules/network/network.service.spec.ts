import { GraphNotFoundException } from '../../common/exceptions/graph-not-found.exception';
import { InMemoryNetworkRepository, MAX_GRAPHS } from '../../storage/in-memory.repository';
import { UploadNetworkDto } from './dto/upload-network.dto';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let repo: InMemoryNetworkRepository;
  let service: NetworkService;

  beforeEach(() => {
    repo = new InMemoryNetworkRepository();
    service = new NetworkService(repo);
  });

  const dto: UploadNetworkDto = {
    edges: [
      { from: 'A', to: 'B', cost: 1 },
      { from: 'B', to: 'C', cost: 2 },
    ],
  };

  it('uploads and returns id + counts', async () => {
    const r = await service.uploadNetwork(dto);
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(r.nodeCount).toBe(3);
    expect(r.edgeCount).toBe(2);
  });

  it('rejects duplicate (from,to) edges', async () => {
    await expect(
      service.uploadNetwork({
        edges: [
          { from: 'A', to: 'B', cost: 1 },
          { from: 'A', to: 'B', cost: 2 },
        ],
      }),
    ).rejects.toThrow(/Duplicate edge/);
  });

  it('rejects self-loops', async () => {
    await expect(
      service.uploadNetwork({ edges: [{ from: 'A', to: 'A', cost: 1 }] }),
    ).rejects.toThrow(/Self-loop/);
  });

  it('getNodes throws GraphNotFoundException for unknown id', async () => {
    await expect(service.getNodes('missing')).rejects.toBeInstanceOf(GraphNotFoundException);
  });

  it('returns nodes for a stored graph', async () => {
    const { id } = await service.uploadNetwork(dto);
    const out = await service.getNodes(id);
    expect(out.graphId).toBe(id);
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('evicts the oldest graph past MAX_GRAPHS', async () => {
    const ids: string[] = [];
    for (let i = 0; i < MAX_GRAPHS + 1; i++) {
      const { id } = await service.uploadNetwork({
        edges: [{ from: `${i}-a`, to: `${i}-b`, cost: 1 }],
      });
      ids.push(id);
    }
    await expect(service.getNodes(ids[0])).rejects.toBeInstanceOf(GraphNotFoundException);
    for (let i = 1; i < ids.length; i++) {
      await expect(service.getNodes(ids[i])).resolves.toBeDefined();
    }
  });
});
