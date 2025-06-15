import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { pickFrom } from 'libs/config';

export enum UserType {
  CLIENT = 'client',
  FREELANCER = 'freelancer',
}

export type JwtPayload = {
  userId: string;
  userType: UserType;
  isRefreshToken?: boolean;
};

@Injectable()
export class JWTService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.secret = pickFrom(this.config, 'jwt.secret', 'app');
    this.expiresIn = pickFrom(this.config, 'jwt.expires_in', 'app');
    this.refreshTokenExpiresIn = pickFrom(
      this.config,
      'jwt.refresh_expires_in',
      'app',
    );
  }

  sign(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.secret,
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.secret,
    });
  }

  verifyAsync(token: string): Promise<JwtPayload> {
    return this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.secret,
    });
  }

  signRefreshToken(payload: JwtPayload): string {
    return this.jwt.sign(
      { ...payload, isRefreshToken: true },
      {
        secret: this.secret,
        expiresIn: this.refreshTokenExpiresIn,
      },
    );
  }
}
