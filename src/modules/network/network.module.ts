import { Module } from '@nestjs/common';
import { InMemoryNetworkRepository } from '../../storage/in-memory.repository';
import { NETWORK_REPOSITORY } from '../../storage/network.repository';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

@Module({
  controllers: [NetworkController],
  providers: [
    NetworkService,
    {
      provide: NETWORK_REPOSITORY,
      useClass: InMemoryNetworkRepository,
    },
  ],
  exports: [NETWORK_REPOSITORY, NetworkService],
})
export class NetworkModule {}
