import { Inject, Injectable } from '@nestjs/common';
import { buildGraph } from '../../domain/graph';
import { GraphNotFoundException } from '../../common/exceptions/graph-not-found.exception';
import { NETWORK_REPOSITORY, NetworkRepository } from '../../storage/network.repository';
import { NetworkNodesResponseDto } from './dto/network-nodes-response.dto';
import { UploadNetworkResponseDto } from './dto/upload-network-response.dto';
import { UploadNetworkDto } from './dto/upload-network.dto';

@Injectable()
export class NetworkService {
  constructor(
    @Inject(NETWORK_REPOSITORY)
    private readonly repo: NetworkRepository,
  ) {}

  async uploadNetwork(dto: UploadNetworkDto): Promise<UploadNetworkResponseDto> {
    const graph = buildGraph(dto.edges, { bidirectional: true });
    await this.repo.save(graph);
    return {
      id: graph.id,
      nodeCount: graph.nodes.size,
      edgeCount: dto.edges.length,
    };
  }

  async getNodes(graphId: string): Promise<NetworkNodesResponseDto> {
    const graph = await this.repo.findById(graphId);
    if (!graph) throw new GraphNotFoundException(graphId);
    return {
      graphId: graph.id,
      nodes: Array.from(graph.nodes.values()).map((n) => ({ id: n.id })),
    };
  }
}
