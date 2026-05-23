import { Injectable } from '@nestjs/common';
import { Graph } from '../domain/types';
import { NetworkRepository } from './network.repository';

export const DEFAULT_MAX_GRAPHS = 5;

function readMaxGraphs(): number {
  const fromEnv = Number(process.env.MAX_GRAPHS);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MAX_GRAPHS;
}

@Injectable()
export class InMemoryNetworkRepository implements NetworkRepository {
  private readonly store = new Map<string, Graph>();
  private readonly maxGraphs = readMaxGraphs();

  async save(graph: Graph): Promise<void> {
    if (this.store.has(graph.id)) {
      this.store.delete(graph.id);
    } else if (this.store.size >= this.maxGraphs) {
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(graph.id, graph);
  }

  async findById(id: string): Promise<Graph | null> {
    return this.store.get(id) ?? null;
  }

  async listIds(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

export const MAX_GRAPHS = DEFAULT_MAX_GRAPHS;
