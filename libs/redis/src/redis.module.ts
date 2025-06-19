import { DynamicModule, Module, Global, Provider, Type } from '@nestjs/common';
import { WorkkapLogger } from 'libs/common/logger';
import { RedisService } from './redis.service';

export const REDIS_URL = Symbol('REDIS_URL');

export interface RedisModuleOptions {
  redisUrl: string;
}

export interface RedisModuleAsyncOptions {
  imports?: Array<Type<unknown> | DynamicModule>;
  inject?: any[];
  useFactory: (...args: unknown[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
}

@Global()
@Module({})
export class RedisModule {
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const redisUrlProvider: Provider = {
      provide: REDIS_URL,
      useFactory: async (...args: unknown[]) => {
        const opts = await options.useFactory(...args);
        return opts.redisUrl;
      },
      inject: options.inject || [],
    };
    return {
      module: RedisModule,
      imports: options.imports || [],
      providers: [redisUrlProvider, RedisService, WorkkapLogger],
      exports: [RedisService],
      global: true,
    };
  }
}
