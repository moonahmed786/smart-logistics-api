import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Edge, Graph, GraphNode, NodeId } from '../domain/types';
import { GraphModel } from './graph.schema';
import { NetworkRepository } from './network.repository';

const DEFAULT_MAX_GRAPHS = 5;

@Injectable()
export class MongoNetworkRepository implements NetworkRepository {
  private readonly maxGraphs: number;

  constructor(@InjectModel(GraphModel.name) private readonly model: Model<GraphModel>) {
    const fromEnv = Number(process.env.MAX_GRAPHS);
    this.maxGraphs = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MAX_GRAPHS;
  }

  async save(graph: Graph): Promise<void> {
    const adjacency: Record<NodeId, Edge[]> = {};
    for (const [k, edges] of graph.adjacency.entries()) adjacency[k] = [...edges];

    await this.model
      .updateOne(
        { graphId: graph.id },
        {
          $set: {
            graphId: graph.id,
            createdAt: graph.createdAt,
            nodes: Array.from(graph.nodes.keys()),
            adjacency,
          },
        },
        { upsert: true },
      )
      .exec();

    const overflow = (await this.model.countDocuments().exec()) - this.maxGraphs;
    if (overflow > 0) {
      const oldest = await this.model
        .find({ graphId: { $ne: graph.id } })
        .sort({ createdAt: 1 })
        .limit(overflow)
        .select({ graphId: 1 })
        .lean()
        .exec();
      if (oldest.length > 0) {
        await this.model.deleteMany({ graphId: { $in: oldest.map((d) => d.graphId) } }).exec();
      }
    }
  }

  async findById(id: string): Promise<Graph | null> {
    const doc = await this.model.findOne({ graphId: id }).lean().exec();
    if (!doc) return null;
    const nodes = new Map<NodeId, GraphNode>();
    for (const n of doc.nodes) nodes.set(n, { id: n });
    const adjacency = new Map<NodeId, Edge[]>();
    for (const [k, edges] of Object.entries(doc.adjacency ?? {})) adjacency.set(k, edges as Edge[]);
    return { id: doc.graphId, createdAt: new Date(doc.createdAt), nodes, adjacency };
  }

  async listIds(): Promise<string[]> {
    const rows = await this.model.find().sort({ createdAt: 1 }).select({ graphId: 1 }).lean().exec();
    return rows.map((r) => r.graphId);
  }
}
