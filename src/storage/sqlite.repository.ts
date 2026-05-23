import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Database, { Database as DB } from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Edge, Graph, GraphNode, NodeId } from '../domain/types';
import { NetworkRepository } from './network.repository';

const DEFAULT_MAX_GRAPHS = 5;
const DEFAULT_SQLITE_PATH = './data/graphs.db';

interface SerializedGraph {
  id: string;
  createdAt: string;
  nodes: NodeId[];
  adjacency: Array<[NodeId, Edge[]]>;
}

@Injectable()
export class SqliteNetworkRepository implements NetworkRepository, OnModuleInit, OnModuleDestroy {
  private db!: DB;
  private maxGraphs!: number;

  onModuleInit(): void {
    const file = process.env.SQLITE_PATH ?? DEFAULT_SQLITE_PATH;
    const fromEnv = Number(process.env.MAX_GRAPHS);
    this.maxGraphs = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MAX_GRAPHS;

    const dir = path.dirname(file);
    if (dir && dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS graphs (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_graphs_created_at ON graphs(created_at);
    `);
  }

  onModuleDestroy(): void {
    this.db?.close();
  }

  async save(graph: Graph): Promise<void> {
    const payload = JSON.stringify(this.serialize(graph));
    const insert = this.db.prepare(
      'INSERT OR REPLACE INTO graphs (id, payload, created_at) VALUES (?, ?, ?)',
    );
    const count = this.db.prepare('SELECT COUNT(*) AS c FROM graphs WHERE id != ?');
    const evict = this.db.prepare(
      'DELETE FROM graphs WHERE id = (SELECT id FROM graphs ORDER BY created_at ASC LIMIT 1)',
    );

    const txn = this.db.transaction(() => {
      insert.run(graph.id, payload, graph.createdAt.getTime());
      let { c } = count.get(graph.id) as { c: number };
      while (c >= this.maxGraphs) {
        evict.run();
        ({ c } = count.get(graph.id) as { c: number });
      }
    });
    txn();
  }

  async findById(id: string): Promise<Graph | null> {
    const row = this.db.prepare('SELECT payload FROM graphs WHERE id = ?').get(id) as
      | { payload: string }
      | undefined;
    if (!row) return null;
    return this.deserialize(JSON.parse(row.payload) as SerializedGraph);
  }

  async listIds(): Promise<string[]> {
    const rows = this.db.prepare('SELECT id FROM graphs ORDER BY created_at ASC').all() as Array<{
      id: string;
    }>;
    return rows.map((r) => r.id);
  }

  private serialize(graph: Graph): SerializedGraph {
    return {
      id: graph.id,
      createdAt: graph.createdAt.toISOString(),
      nodes: Array.from(graph.nodes.keys()),
      adjacency: Array.from(graph.adjacency.entries()).map(([k, v]) => [k, [...v]]),
    };
  }

  private deserialize(s: SerializedGraph): Graph {
    const nodes = new Map<NodeId, GraphNode>();
    for (const id of s.nodes) nodes.set(id, { id });
    const adjacency = new Map<NodeId, Edge[]>();
    for (const [k, edges] of s.adjacency) adjacency.set(k, edges);
    return { id: s.id, createdAt: new Date(s.createdAt), nodes, adjacency };
  }
}
