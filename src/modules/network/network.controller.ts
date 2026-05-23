import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { NetworkNodesResponseDto } from './dto/network-nodes-response.dto';
import { UploadNetworkResponseDto } from './dto/upload-network-response.dto';
import { UploadNetworkDto } from './dto/upload-network.dto';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private readonly service: NetworkService) {}

  @Post('upload')
  @HttpCode(201)
  upload(@Body() dto: UploadNetworkDto): Promise<UploadNetworkResponseDto> {
    return this.service.uploadNetwork(dto);
  }

  @Get('nodes/:id')
  nodes(@Param('id') id: string): Promise<NetworkNodesResponseDto> {
    return this.service.getNodes(id);
  }
}
