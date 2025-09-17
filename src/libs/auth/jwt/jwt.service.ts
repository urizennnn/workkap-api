import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { pickFrom } from 'src/libs/config';

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
  private readonly defaultAccessTokenExpiresIn: string;
  private readonly defaultRefreshTokenExpiresIn: string;
  private readonly accessTokenExpiresIn: Record<UserType, string>;
  private readonly refreshTokenExpiresIn: Record<UserType, string>;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.secret = pickFrom(this.config, 'jwt.secret', 'app');
    this.defaultAccessTokenExpiresIn = pickFrom(
      this.config,
      'jwt.expires_in',
      'app',
    );
    this.defaultRefreshTokenExpiresIn = pickFrom(
      this.config,
      'jwt.refresh_expires_in',
      'app',
    );
    this.accessTokenExpiresIn = {
      [UserType.CLIENT]: pickFrom(this.config, 'jwt.client_expires_in', 'app'),
      [UserType.FREELANCER]: pickFrom(
        this.config,
        'jwt.freelancer_expires_in',
        'app',
      ),
    };
    this.refreshTokenExpiresIn = {
      [UserType.CLIENT]: pickFrom(
        this.config,
        'jwt.client_refresh_expires_in',
        'app',
      ),
      [UserType.FREELANCER]: pickFrom(
        this.config,
        'jwt.freelancer_refresh_expires_in',
        'app',
      ),
    };
  }

  sign(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.secret,
      expiresIn:
        this.accessTokenExpiresIn[payload.userType] ??
        this.defaultAccessTokenExpiresIn,
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
        expiresIn:
          this.refreshTokenExpiresIn[payload.userType] ??
          this.defaultRefreshTokenExpiresIn,
      },
    );
  }
}
