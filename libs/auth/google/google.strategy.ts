import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.client_id'),
      clientSecret: configService.get<string>('google.client_secret'),
      callbackURL: configService.get<string>('google.callback_url'),
      scope: ['profile', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    const { name, emails, photos } = profile;
    const user = {
      email: emails && emails[0]?.value,
      fullName:
        name?.givenName || name?.familyName
          ? `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim()
          : profile.displayName,
      profilePictureUrl: photos && photos[0]?.value,
    };
    done(null, user);
  }
}
