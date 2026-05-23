import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NetworkNodesResponseDto } from './dto/network-nodes-response.dto';
import { UploadNetworkResponseDto } from './dto/upload-network-response.dto';
import { UploadNetworkDto } from './dto/upload-network.dto';
import { NetworkService } from './network.service';

@ApiTags('network')
@Controller('network')
export class NetworkController {
  constructor(private readonly service: NetworkService) {}

  @Post('upload')
  @HttpCode(201)
  @ApiOperation({ summary: 'Upload a new graph definition' })
  @ApiResponse({ status: 201, type: UploadNetworkResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid graph payload' })
  upload(@Body() dto: UploadNetworkDto): Promise<UploadNetworkResponseDto> {
    return this.service.uploadNetwork(dto);
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'List nodes for a stored graph' })
  @ApiResponse({ status: 200, type: NetworkNodesResponseDto })
  @ApiResponse({ status: 404, description: 'Graph not found' })
  nodes(@Param('id') id: string): Promise<NetworkNodesResponseDto> {
    return this.service.getNodes(id);
  }
}
