import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  GoogleAuthModule,
  JWTService,
  EmailModule,
  RedisModule,
  PaystackModule,
} from 'libs';

@Module({
  imports: [GoogleAuthModule, EmailModule, RedisModule, PaystackModule],
  controllers: [UserController],
  providers: [UserService, JWTService],
})
export class UserModule {}
