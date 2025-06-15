import { Request } from 'express';
import { JwtPayload } from 'libs/auth';
declare module 'express' {
  interface Request {
    user: JwtPayload;
  }
}
