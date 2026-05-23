import { Edge, Graph, NodeId } from '../domain/types';
import { MinHeap } from './priority-queue';

export interface DijkstraInput {
  graph: Graph;
  origin: NodeId;
  destination: NodeId;
  weightOf: (edge: Edge) => number;
  edgeAllowed?: (edge: Edge) => boolean;
}

export interface DijkstraResult {
  totalCost: number;
  path: NodeId[];
}

interface HeapEntry {
  node: NodeId;
  dist: number;
}

export function dijkstra(input: DijkstraInput): DijkstraResult | null {
  const { graph, origin, destination, weightOf, edgeAllowed } = input;

  if (origin === destination) {
    return { totalCost: 0, path: [origin] };
  }

  const dist = new Map<NodeId, number>();
  const prev = new Map<NodeId, NodeId>();
  const settled = new Set<NodeId>();
  const heap = new MinHeap<HeapEntry>((a, b) => a.dist - b.dist);

  dist.set(origin, 0);
  heap.push({ node: origin, dist: 0 });

  while (heap.size > 0) {
    const top = heap.pop() as HeapEntry;
    const u = top.node;
    if (settled.has(u)) continue;
    settled.add(u);
    if (u === destination) break;

    const edges = graph.adjacency.get(u) ?? [];
    for (const edge of edges) {
      if (edgeAllowed && !edgeAllowed(edge)) continue;
      const v = edge.to;
      if (settled.has(v)) continue;
      const w = weightOf(edge);
      if (w < 0) {
        throw new Error('Dijkstra invariant violated: negative edge weight');
      }
      const alt = top.dist + w;
      const known = dist.get(v);
      if (known === undefined || alt < known) {
        dist.set(v, alt);
        prev.set(v, u);
        heap.push({ node: v, dist: alt });
      }
    }
  }

  if (!dist.has(destination)) return null;

  const path: NodeId[] = [];
  let cur: NodeId | undefined = destination;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }

  return { totalCost: dist.get(destination) as number, path };
}
