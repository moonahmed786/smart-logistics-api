import { Module } from '@nestjs/common';
import { NetworkModule } from './modules/network/network.module';
import { RouteModule } from './modules/route/route.module';

@Module({
  imports: [NetworkModule, RouteModule],
})
export class AppModule {}
