import { BadRequestException } from '@nestjs/common';

export class NodeNotFoundException extends BadRequestException {
  constructor(nodeId: string) {
    super(`Node not found in graph: ${nodeId}`);
  }
}
