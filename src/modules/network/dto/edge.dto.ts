import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export const NODE_ID_MAX = 64;
export const EDGE_TAG_MAX = 32;

const finiteNumber = { allowNaN: false, allowInfinity: false } as const;

export class EdgeDto {
  @ApiProperty({ example: 'A', description: 'Origin node identifier', maxLength: NODE_ID_MAX })
  @IsString()
  @Length(1, NODE_ID_MAX)
  from!: string;

  @ApiProperty({ example: 'B', description: 'Destination node identifier', maxLength: NODE_ID_MAX })
  @IsString()
  @Length(1, NODE_ID_MAX)
  to!: string;

  @ApiProperty({ example: 10, description: 'Distance / monetary cost (used by preference=shortest)' })
  @IsNumber(finiteNumber)
  @Min(0)
  cost!: number;

  @ApiPropertyOptional({ example: 12, description: 'Travel time in minutes (used by preference=fastest)' })
  @IsOptional()
  @IsNumber(finiteNumber)
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: ['highway'],
    description: 'Tags applied to the edge (e.g. highway, toll)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(EDGE_TAG_MAX, { each: true })
  tags?: string[];
}
