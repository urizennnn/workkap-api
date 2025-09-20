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
import { UnifiedRedirectService } from 'src/unified-redirect';

@Module({
  imports: [GoogleAuthModule, EmailModule, RedisModule, PaymentModule],
  controllers: [UserController],
  providers: [UserService, JWTService, UnifiedRedirectService],
})
export class UserModule {}
