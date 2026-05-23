import { ApiProperty } from '@nestjs/swagger';

export class OptimizeRouteResponseDto {
  @ApiProperty({ example: 'b3f1f3d9-1b1e-4f6d-9b4a-3e3a3b3d3e3f' })
  graphId!: string;

  @ApiProperty({ example: 25.5 })
  totalCost!: number;

  @ApiProperty({ example: ['A', 'C', 'D', 'E'], description: 'Node ids from origin to destination' })
  path!: string[];

  @ApiProperty({ example: 4, description: 'Wall-clock time of the algorithm in milliseconds' })
  durationMs!: number;

  @ApiProperty({ example: 'shortest', enum: ['shortest', 'fastest'] })
  preference!: 'shortest' | 'fastest';
}
