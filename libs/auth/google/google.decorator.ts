import { applyDecorators, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './google.guard';

export function Google() {
  return applyDecorators(UseGuards(GoogleAuthGuard));
}
