import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

export interface JWTOptions {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider['inject'];
  useFactory(
    this: void,
    ...args: unknown[]
  ): Promise<JwtModuleOptions> | JwtModuleOptions;
}

@Module({})
export class GlobalJWTModule {
  static initAsync(options: JWTOptions): DynamicModule {
    options.imports ||= [];
    options.inject ||= [];
    return {
      global: true,
      module: GlobalJWTModule,
      exports: [JwtModule],
      imports: [
        ...options.imports,
        JwtModule.registerAsync({
          useFactory: (...args: unknown[]) => options.useFactory(...args),
          inject: options.inject,
        }),
      ],
    };
  }
}
