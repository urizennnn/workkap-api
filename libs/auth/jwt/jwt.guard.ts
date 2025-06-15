import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JWTService } from './jwt.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JWTService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['authorization'];
    if (!header)
      throw new UnauthorizedException('Missing authorization header');
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    try {
      const payload = this.jwt.verify(token);
      if (payload.isRefreshToken) {
        throw new UnauthorizedException(
          'Refresh tokens cannot be used for requests',
        );
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
