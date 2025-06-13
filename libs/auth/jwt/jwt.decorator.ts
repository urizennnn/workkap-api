import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

export function NeedsAuth() {
  return applyDecorators(UseGuards(JwtGuard));
}
