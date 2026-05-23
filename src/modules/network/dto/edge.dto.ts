import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EdgeDto {
  @ApiProperty({ example: 'A', description: 'Origin node identifier' })
  @IsString()
  from!: string;

  @ApiProperty({ example: 'B', description: 'Destination node identifier' })
  @IsString()
  to!: string;

  @ApiProperty({ example: 10, description: 'Distance / monetary cost (used by preference=shortest)' })
  @IsNumber()
  @Min(0)
  cost!: number;

  @ApiPropertyOptional({ example: 12, description: 'Travel time in minutes (used by preference=fastest)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: ['highway'], description: 'Tags applied to the edge (e.g. highway, toll)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
