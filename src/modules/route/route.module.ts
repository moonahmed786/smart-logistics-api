import { Module } from '@nestjs/common';
import { NetworkModule } from '../network/network.module';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';

@Module({
  imports: [NetworkModule],
  controllers: [RouteController],
  providers: [RouteService],
})
export class RouteModule {}
