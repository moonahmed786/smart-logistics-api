import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphModel, GraphSchema } from '../../storage/graph.schema';
import { MongoNetworkRepository } from '../../storage/mongo.repository';
import { NETWORK_REPOSITORY } from '../../storage/network.repository';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: GraphModel.name, schema: GraphSchema }])],
  controllers: [NetworkController],
  providers: [
    NetworkService,
    MongoNetworkRepository,
    { provide: NETWORK_REPOSITORY, useExisting: MongoNetworkRepository },
  ],
  exports: [NETWORK_REPOSITORY, NetworkService],
})
export class NetworkModule {}
