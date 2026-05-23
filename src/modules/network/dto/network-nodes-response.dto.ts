import { ApiProperty } from '@nestjs/swagger';

export class NodeDto {
  @ApiProperty({ example: 'A' })
  id!: string;
}

export class NetworkNodesResponseDto {
  @ApiProperty({ example: 'b3f1f3d9-1b1e-4f6d-9b4a-3e3a3b3d3e3f' })
  graphId!: string;

  @ApiProperty({ type: [NodeDto] })
  nodes!: NodeDto[];
}
