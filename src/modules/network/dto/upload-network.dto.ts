import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { EdgeDto } from './edge.dto';

export const MAX_EDGES_PER_UPLOAD = 10_000;

export class UploadNetworkDto {
  @ApiProperty({
    type: [EdgeDto],
    description: 'List of edges describing the network. Each edge is bidirectional.',
    maxItems: MAX_EDGES_PER_UPLOAD,
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EDGES_PER_UPLOAD)
  @Type(() => EdgeDto)
  edges!: EdgeDto[];
}
