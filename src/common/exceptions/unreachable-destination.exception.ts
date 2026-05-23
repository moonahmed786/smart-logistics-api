import { NotFoundException } from '@nestjs/common';

export class UnreachableDestinationException extends NotFoundException {
  constructor(origin: string, destination: string) {
    super(`No path from ${origin} to ${destination}`);
  }
}
