import { Injectable } from '@nestjs/common';
import { Graph } from '../domain/types';
import { NetworkRepository } from './network.repository';

export const MAX_GRAPHS = 5;

@Injectable()
export class InMemoryNetworkRepository implements NetworkRepository {
  private readonly store = new Map<string, Graph>();

  async save(graph: Graph): Promise<void> {
    if (this.store.has(graph.id)) {
      this.store.delete(graph.id);
    } else if (this.store.size >= MAX_GRAPHS) {
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
