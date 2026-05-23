import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Preference } from '../../../domain/types';
import { NODE_ID_MAX } from '../../network/dto/edge.dto';
import { RouteConstraintsDto } from './route-constraints.dto';

export class OptimizeRouteDto {
  @ApiProperty({ example: 'A', maxLength: NODE_ID_MAX })
  @IsString()
  @Length(1, NODE_ID_MAX)
  originNodeId!: string;

  @ApiProperty({ example: 'E', maxLength: NODE_ID_MAX })
  @IsString()
  @Length(1, NODE_ID_MAX)
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
