import { Inject, Injectable } from '@nestjs/common';
import { dijkstra } from '../../algorithms/dijkstra';
import { buildEdgePredicate, resolveWeight } from '../../algorithms/weight-resolver';
import { GraphNotFoundException } from '../../common/exceptions/graph-not-found.exception';
import { NodeNotFoundException } from '../../common/exceptions/node-not-found.exception';
import { UnreachableDestinationException } from '../../common/exceptions/unreachable-destination.exception';
import { Preference } from '../../domain/types';
import { NETWORK_REPOSITORY, NetworkRepository } from '../../storage/network.repository';
import { OptimizeRouteResponseDto } from './dto/optimize-route-response.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

@Injectable()
export class RouteService {
  constructor(
    @Inject(NETWORK_REPOSITORY)
    private readonly repo: NetworkRepository,
  ) {}

  async optimize(graphId: string, dto: OptimizeRouteDto): Promise<OptimizeRouteResponseDto> {
    const graph = await this.repo.findById(graphId);
    if (!graph) throw new GraphNotFoundException(graphId);

    if (!graph.nodes.has(dto.originNodeId)) {
      throw new NodeNotFoundException(dto.originNodeId);
    }
    if (!graph.nodes.has(dto.destinationNodeId)) {
      throw new NodeNotFoundException(dto.destinationNodeId);
    }

    const preference: Preference = dto.preference ?? 'shortest';

    if (dto.originNodeId === dto.destinationNodeId) {
      return {
        graphId: graph.id,
        totalCost: 0,
        path: [dto.originNodeId],
        durationMs: 0,
        preference,
      };
    }

    const weightOf = resolveWeight(preference);
    const edgeAllowed = buildEdgePredicate(dto.constraints);

    const start = process.hrtime.bigint();
    const result = dijkstra({
      graph,
      origin: dto.originNodeId,
      destination: dto.destinationNodeId,
      weightOf,
      edgeAllowed,
    });
    const end = process.hrtime.bigint();

    if (!result) {
      throw new UnreachableDestinationException(dto.originNodeId, dto.destinationNodeId);
    }

    return {
      graphId: graph.id,
      totalCost: result.totalCost,
      path: result.path,
      durationMs: Number((end - start) / 1000n) / 1000,
      preference,
    };
  }
}
