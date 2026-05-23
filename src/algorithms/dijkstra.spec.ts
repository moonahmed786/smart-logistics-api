import { buildGraph } from '../domain/graph';
import { Edge } from '../domain/types';
import { dijkstra } from './dijkstra';
import { buildEdgePredicate, resolveWeight } from './weight-resolver';

const shortest = resolveWeight('shortest');

const README_EDGES: Edge[] = [
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
];

describe('dijkstra', () => {
  it('returns cost 0 for origin === destination', () => {
    const g = buildGraph([{ from: 'A', to: 'B', cost: 1 }]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'A', weightOf: shortest });
    expect(result).toEqual({ totalCost: 0, path: ['A'] });
  });

  it('two-node direct path', () => {
    const g = buildGraph([{ from: 'A', to: 'B', cost: 5 }]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'B', weightOf: shortest });
    expect(result).toEqual({ totalCost: 5, path: ['A', 'B'] });
  });

  it('linear chain A->B->C->D', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 1 },
      { from: 'B', to: 'C', cost: 2 },
      { from: 'C', to: 'D', cost: 3 },
    ]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: shortest });
    expect(result).toEqual({ totalCost: 6, path: ['A', 'B', 'C', 'D'] });
  });

  it('diamond picks cheaper branch', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 10 },
      { from: 'B', to: 'D', cost: 10 },
      { from: 'A', to: 'C', cost: 3 },
      { from: 'C', to: 'D', cost: 3 },
    ]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: shortest });
    expect(result).toEqual({ totalCost: 6, path: ['A', 'C', 'D'] });
  });

  it('tie-break: returns one valid path of correct cost', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 5 },
      { from: 'B', to: 'D', cost: 5 },
      { from: 'A', to: 'C', cost: 5 },
      { from: 'C', to: 'D', cost: 5 },
    ]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: shortest });
    expect(result?.totalCost).toBe(10);
    expect(result?.path[0]).toBe('A');
    expect(result?.path[result!.path.length - 1]).toBe('D');
    expect(result?.path.length).toBe(3);
  });

  it('returns null for disconnected destination', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 1 },
      { from: 'C', to: 'D', cost: 1 },
    ]);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: shortest });
    expect(result).toBeNull();
  });

  it('README example: A->E shortest is 27 via A,C,H,F,G,E', () => {
    const g = buildGraph(README_EDGES);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'E', weightOf: shortest });
    expect(result?.totalCost).toBe(27);
    expect(result?.path).toEqual(['A', 'C', 'H', 'F', 'G', 'E']);
  });

  it('README example: A->G shortest is 18 via A,C,H,F,G', () => {
    const g = buildGraph(README_EDGES);
    const result = dijkstra({ graph: g, origin: 'A', destination: 'G', weightOf: shortest });
    expect(result?.totalCost).toBe(18);
    expect(result?.path).toEqual(['A', 'C', 'H', 'F', 'G']);
  });

  it('edge predicate that removes the only path returns null', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 1, tags: ['blocked'] },
    ]);
    const result = dijkstra({
      graph: g,
      origin: 'A',
      destination: 'B',
      weightOf: shortest,
      edgeAllowed: (e) => !e.tags?.includes('blocked'),
    });
    expect(result).toBeNull();
  });

  it('preference=fastest can flip the chosen path', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 1, durationMinutes: 100 },
      { from: 'B', to: 'D', cost: 1, durationMinutes: 100 },
      { from: 'A', to: 'C', cost: 100, durationMinutes: 1 },
      { from: 'C', to: 'D', cost: 100, durationMinutes: 1 },
    ]);
    const byCost = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: resolveWeight('shortest') });
    const byTime = dijkstra({ graph: g, origin: 'A', destination: 'D', weightOf: resolveWeight('fastest') });
    expect(byCost?.path).toEqual(['A', 'B', 'D']);
    expect(byTime?.path).toEqual(['A', 'C', 'D']);
  });

  it('avoidHighways forces a longer route', () => {
    const g = buildGraph([
      { from: 'A', to: 'B', cost: 1, tags: ['highway'] },
      { from: 'A', to: 'C', cost: 5 },
      { from: 'C', to: 'B', cost: 5 },
    ]);
    const allowAll = dijkstra({ graph: g, origin: 'A', destination: 'B', weightOf: shortest });
    const noHighway = dijkstra({
      graph: g,
      origin: 'A',
      destination: 'B',
      weightOf: shortest,
      edgeAllowed: buildEdgePredicate({ avoidHighways: true }),
    });
    expect(allowAll?.totalCost).toBe(1);
    expect(noHighway?.totalCost).toBe(10);
    expect(noHighway?.path).toEqual(['A', 'C', 'B']);
  });

  it('throws when a negative-weight edge is encountered', () => {
    const g = buildGraph([{ from: 'A', to: 'B', cost: 1 }]);
    const negativeWeight = () => -1;
    expect(() =>
      dijkstra({ graph: g, origin: 'A', destination: 'B', weightOf: negativeWeight }),
    ).toThrow(/negative edge weight/);
  });

  it('completes a 1000-node random graph quickly', () => {
    const edges: Edge[] = [];
    const N = 1000;
    for (let i = 0; i < N - 1; i++) {
      edges.push({ from: `n${i}`, to: `n${i + 1}`, cost: 1 + Math.random() });
    }
    for (let i = 0; i < 4000; i++) {
      const a = Math.floor(Math.random() * N);
      let b = Math.floor(Math.random() * N);
      if (a === b) b = (b + 1) % N;
      try {
        edges.push({ from: `n${a}`, to: `n${b}`, cost: 1 + Math.random() * 10 });
      } catch {
        // ignore duplicates from buildGraph dedupe
      }
    }
    let g;
    try {
      g = buildGraph(edges);
    } catch {
      const dedup = new Map<string, Edge>();
      for (const e of edges) dedup.set(`${e.from}|${e.to}`, e);
      g = buildGraph(Array.from(dedup.values()));
    }
    const start = Date.now();
    const r = dijkstra({ graph: g, origin: 'n0', destination: `n${N - 1}`, weightOf: shortest });
    const elapsed = Date.now() - start;
    expect(r).not.toBeNull();
    expect(elapsed).toBeLessThan(500);
  });
});
