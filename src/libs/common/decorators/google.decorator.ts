import { applyDecorators, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from 'src/libs';

export function Google() {
  return applyDecorators(UseGuards(GoogleAuthGuard));
}
