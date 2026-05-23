import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class RouteConstraintsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'If true, edges tagged "highway" are temporarily ignored',
  })
  @IsOptional()
  @IsBoolean()
  avoidHighways?: boolean;

  @ApiPropertyOptional({
    example: ['toll'],
    description: 'Additional edge tags to avoid',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidTags?: string[];
}
