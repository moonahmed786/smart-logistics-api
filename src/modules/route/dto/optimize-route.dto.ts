import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Preference } from '../../../domain/types';
import { RouteConstraintsDto } from './route-constraints.dto';

export class OptimizeRouteDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  originNodeId!: string;

  @ApiProperty({ example: 'E' })
  @IsString()
  destinationNodeId!: string;

  @ApiPropertyOptional({
    example: 'shortest',
    enum: ['shortest', 'fastest'],
    description: 'Weight to optimise. fastest falls back to cost when an edge lacks durationMinutes.',
  })
  @IsOptional()
  @IsIn(['shortest', 'fastest'])
  preference?: Preference;

  @ApiPropertyOptional({ type: RouteConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteConstraintsDto)
  constraints?: RouteConstraintsDto;
}
