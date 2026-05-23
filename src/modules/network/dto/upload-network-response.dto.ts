import { ApiProperty } from '@nestjs/swagger';

export class UploadNetworkResponseDto {
  @ApiProperty({ example: 'b3f1f3d9-1b1e-4f6d-9b4a-3e3a3b3d3e3f', description: 'Graph identifier (UUID v4)' })
  id!: string;

  @ApiProperty({ example: 8 })
  nodeCount!: number;

  @ApiProperty({ example: 11, description: 'Number of edges as uploaded (each edge stored bidirectionally)' })
  edgeCount!: number;
}
