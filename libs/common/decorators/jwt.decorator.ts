import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'libs';

export function NeedsAuth() {
  return applyDecorators(UseGuards(JwtGuard));
}
