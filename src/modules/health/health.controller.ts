import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @Get('healthz')
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  @Public()
  @Get('readyz')
  @ApiOperation({ summary: 'Readiness probe' })
  readiness(): { status: 'ready' } {
    return { status: 'ready' };
  }
}
