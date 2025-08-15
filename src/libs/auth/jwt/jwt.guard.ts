import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JWTService, UserType } from './jwt.service';

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

@Injectable()
export class ClientAuth implements CanActivate {
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
      if (payload.userType !== UserType.CLIENT) {
        throw new UnauthorizedException('This endpoint is for clients only');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

@Injectable()
export class FreelancerAuth implements CanActivate {
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
      if (payload.userType !== UserType.FREELANCER) {
        throw new UnauthorizedException(
          'This endpoint is for freelancers only',
        );
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
