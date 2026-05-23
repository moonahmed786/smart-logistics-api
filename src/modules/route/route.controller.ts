import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptimizeRouteResponseDto } from './dto/optimize-route-response.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { RouteService } from './route.service';

@ApiTags('route')
@Controller('route')
export class RouteController {
  constructor(private readonly service: RouteService) {}

  @Post('optimize/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Compute the optimal path through a stored graph' })
  @ApiResponse({ status: 200, type: OptimizeRouteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid origin/destination or body' })
  @ApiResponse({ status: 404, description: 'Graph not found or destination unreachable' })
  optimize(
    @Param('id') id: string,
    @Body() dto: OptimizeRouteDto,
  ): Promise<OptimizeRouteResponseDto> {
    return this.service.optimize(id, dto);
  }
}
