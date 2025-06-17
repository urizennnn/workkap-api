import type { Request } from 'express';
import type { JwtPayload } from 'libs/auth';

export interface GoogleOAuthUser {
  email?: string;
  fullName?: string;
  profilePictureUrl?: string;
}

export type RequestUser = JwtPayload | GoogleOAuthUser;

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

export type AuthorizedRequest = Request & { user: JwtPayload };
export type GoogleRequest = Request & { user: GoogleOAuthUser };
