import { v4 as uuid } from 'uuid';
import { Edge, Graph, GraphNode, NodeId } from './types';

export interface BuildGraphOptions {
  bidirectional?: boolean;
}

export function buildGraph(inputEdges: Edge[], options: BuildGraphOptions = {}): Graph {
  const bidirectional = options.bidirectional !== false;

  const seenPair = new Set<string>();
  for (const e of inputEdges) {
    if (!Number.isFinite(e.cost) || e.cost < 0) {
      throw new Error(`Invalid edge cost for ${e.from}->${e.to}: ${e.cost}`);
    }
    if (e.durationMinutes !== undefined && (!Number.isFinite(e.durationMinutes) || e.durationMinutes < 0)) {
      throw new Error(`Invalid durationMinutes for ${e.from}->${e.to}: ${e.durationMinutes}`);
    }
    if (e.from === e.to) {
      throw new Error(`Self-loop edge not permitted: ${e.from}->${e.to}`);
    }
    const key = `${e.from}|${e.to}`;
    if (seenPair.has(key)) {
      throw new Error(`Duplicate edge in upload: ${e.from}->${e.to}`);
    }
    seenPair.add(key);
  }

  const nodes = new Map<NodeId, GraphNode>();
  const adjacency = new Map<NodeId, Edge[]>();
  const ensure = (id: NodeId) => {
    if (!nodes.has(id)) nodes.set(id, { id });
    if (!adjacency.has(id)) adjacency.set(id, []);
  };

  for (const e of inputEdges) {
    ensure(e.from);
    ensure(e.to);
    adjacency.get(e.from)!.push({ ...e });
    if (bidirectional) {
      adjacency.get(e.to)!.push({
        from: e.to,
        to: e.from,
        cost: e.cost,
        durationMinutes: e.durationMinutes,
        tags: e.tags ? [...e.tags] : undefined,
      });
    }
  }

  return {
    id: uuid(),
    nodes,
    adjacency,
    createdAt: new Date(),
  };
}
