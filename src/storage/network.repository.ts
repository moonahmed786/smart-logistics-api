import { Graph } from '../domain/types';

export const NETWORK_REPOSITORY = Symbol('NETWORK_REPOSITORY');

export interface NetworkRepository {
  save(graph: Graph): Promise<void>;
  findById(id: string): Promise<Graph | null>;
  listIds(): Promise<string[]>;
}
