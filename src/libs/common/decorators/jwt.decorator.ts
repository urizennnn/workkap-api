import { applyDecorators, UseGuards } from '@nestjs/common';
import { ClientAuth, FreelancerAuth, JwtGuard } from 'src/libs';

export function NeedsAuth() {
  return applyDecorators(UseGuards(JwtGuard));
}

export function NeedsClientAuth() {
  return applyDecorators(UseGuards(ClientAuth));
}

export function NeedsFreelancerAuth() {
  return applyDecorators(UseGuards(FreelancerAuth));
}
