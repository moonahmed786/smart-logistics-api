import { NotFoundException } from '@nestjs/common';

export class GraphNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Graph not found: ${id}`);
  }
}
