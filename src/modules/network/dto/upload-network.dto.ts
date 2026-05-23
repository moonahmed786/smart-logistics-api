import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { EdgeDto } from './edge.dto';

export class UploadNetworkDto {
  @ApiProperty({
    type: [EdgeDto],
    description: 'List of edges describing the network. Each edge is bidirectional.',
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EdgeDto)
  edges!: EdgeDto[];
}
