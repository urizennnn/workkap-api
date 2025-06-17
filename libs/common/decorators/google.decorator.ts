import { applyDecorators, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from 'libs';

export function Google() {
  return applyDecorators(UseGuards(GoogleAuthGuard));
}
