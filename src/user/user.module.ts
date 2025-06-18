import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { GoogleAuthModule, JWTService } from 'libs';

@Module({
  imports: [GoogleAuthModule],
  providers: [UserService, JWTService],
  exports: [UserService],
})
export class UserModule {}
