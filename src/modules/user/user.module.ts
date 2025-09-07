import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  GoogleAuthModule,
  JWTService,
  EmailModule,
  RedisModule,
  PaymentModule,
} from 'src/libs';

@Module({
  imports: [GoogleAuthModule, EmailModule, RedisModule, PaymentModule],
  controllers: [UserController],
  providers: [UserService, JWTService],
})
export class UserModule {}

