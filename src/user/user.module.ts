import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { GoogleAuthModule, JWTService } from 'libs';

@Module({
  imports: [GoogleAuthModule],
  controllers: [UserController],
  providers: [UserService, JWTService],
})
export class UserModule {}
