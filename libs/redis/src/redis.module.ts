import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkkapLogger } from 'libs/common/logger';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, WorkkapLogger],
  exports: [RedisService],
})
export class RedisModule {}
