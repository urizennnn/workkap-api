import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
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
  imports: [CacheModule.register(), GoogleAuthModule, EmailModule, RedisModule, PaymentModule],
  controllers: [UserController],
  providers: [UserService, JWTService, UnifiedRedirectService],
})
export class UserModule {}
