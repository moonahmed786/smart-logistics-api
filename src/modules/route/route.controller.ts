import { Body, Controller, Param, Post } from '@nestjs/common';
import { OptimizeRouteResponseDto } from './dto/optimize-route-response.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
  constructor(private readonly service: RouteService) {}

  @Post('optimize/:id')
  optimize(
    @Param('id') id: string,
    @Body() dto: OptimizeRouteDto,
  ): Promise<OptimizeRouteResponseDto> {
    return this.service.optimize(id, dto);
  }
}
