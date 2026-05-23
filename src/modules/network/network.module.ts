import { Module } from '@nestjs/common';
import { InMemoryNetworkRepository } from '../../storage/in-memory.repository';
import { NETWORK_REPOSITORY } from '../../storage/network.repository';
import { SqliteNetworkRepository } from '../../storage/sqlite.repository';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

@Module({
  controllers: [NetworkController],
  providers: [
    NetworkService,
    InMemoryNetworkRepository,
    SqliteNetworkRepository,
    {
      provide: NETWORK_REPOSITORY,
      inject: [InMemoryNetworkRepository, SqliteNetworkRepository],
      useFactory: (memory: InMemoryNetworkRepository, sqlite: SqliteNetworkRepository) =>
        process.env.STORAGE_DRIVER === 'sqlite' ? sqlite : memory,
    },
  ],
  exports: [NETWORK_REPOSITORY, NetworkService],
})
export class NetworkModule {}
