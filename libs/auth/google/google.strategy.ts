import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { pickFrom } from 'libs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: pickFrom(configService, 'google.client_id', 'app'),
      clientSecret: pickFrom(configService, 'google.client_secret', 'app'),
      callbackURL: pickFrom(configService, 'google.callback_url', 'app'),
      scope: ['profile', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): {
    email: string;
    fullName: string;
    profilePictureUrl: string | undefined;
  } {
    const email = profile.emails?.[0]?.value ?? '';

    const given = profile.name?.givenName ?? '';
    const family = profile.name?.familyName ?? '';
    const fullName =
      given || family ? `${given} ${family}`.trim() : profile.displayName;

    const profilePictureUrl = profile.photos?.[0]?.value;

    return { email, fullName, profilePictureUrl };
  }
}
