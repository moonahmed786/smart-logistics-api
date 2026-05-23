import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { dijkstra } from '../../algorithms/dijkstra';
import { buildEdgePredicate, resolveWeight } from '../../algorithms/weight-resolver';
import { GraphNotFoundException } from '../../common/exceptions/graph-not-found.exception';
import { NodeNotFoundException } from '../../common/exceptions/node-not-found.exception';
import { UnreachableDestinationException } from '../../common/exceptions/unreachable-destination.exception';
import { Preference } from '../../domain/types';
import { NETWORK_REPOSITORY, NetworkRepository } from '../../storage/network.repository';
import { OptimizeRouteResponseDto } from './dto/optimize-route-response.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

const DEFAULT_TIMEOUT_MS = 500;

@Injectable()
export class RouteService {
  private readonly timeoutMs: number;

  constructor(
    @Inject(NETWORK_REPOSITORY)
    private readonly repo: NetworkRepository,
  ) {
    const fromEnv = Number(process.env.DIJKSTRA_TIMEOUT_MS);
    this.timeoutMs = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_TIMEOUT_MS;
  }

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

    const deadline = Date.now() + this.timeoutMs;
    let aborted = false;
    const guardedAllowed = (edge: Parameters<typeof edgeAllowed>[0]): boolean => {
      if (!aborted && Date.now() > deadline) aborted = true;
      if (aborted) return false;
      return edgeAllowed(edge);
    };

    const start = process.hrtime.bigint();
    const result = dijkstra({
      graph,
      origin: dto.originNodeId,
      destination: dto.destinationNodeId,
      weightOf,
      edgeAllowed: guardedAllowed,
    });
    const end = process.hrtime.bigint();

    if (aborted) {
      throw new ServiceUnavailableException(
        `Route computation exceeded ${this.timeoutMs}ms time budget`,
      );
    }

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
