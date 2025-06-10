import { DynamicModule, Module, Global, Provider, Type } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { WorkkapLogger } from 'libs/common/logger';
export const DATABASE_URL = Symbol('DATABASE_URL');

export interface PrismaModuleOptions {
  databaseUrl: string;
}

export interface PrismaModuleAsyncOptions {
  imports?: Array<Type<any> | DynamicModule>;
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<PrismaModuleOptions> | PrismaModuleOptions;
}

@Global()
@Module({})
export class PrismaModule {
  static forRootAsync(options: PrismaModuleAsyncOptions): DynamicModule {
    const databaseUrlProvider: Provider = {
      provide: DATABASE_URL,
      useFactory: async (...args: any[]) => {
        const opts = await options.useFactory(...args);
        return opts.databaseUrl;
      },
      inject: options.inject || [],
    };

    return {
      module: PrismaModule,
      imports: options.imports || [],
      providers: [databaseUrlProvider, PrismaService, WorkkapLogger],
      exports: [PrismaService],
      global: true,
    };
  }
}
