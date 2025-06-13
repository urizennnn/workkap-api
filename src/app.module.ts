import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule, WorkkapMiddlewareLogger } from 'libs/common/logger';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfigFactory, pickFrom } from 'libs/config';
import { UserModule } from './user/user.module';
import { GlobalJWTModule } from 'libs/auth/jwt/jwt.module';
import { PrismaModule } from 'libs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfigFactory] }),
    GlobalJWTModule.initAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: pickFrom(config, 'jwt.secret', 'app'),
      }),
    }),
    LoggerModule,
    PrismaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        databaseUrl: pickFrom(configService, 'db.url', 'app'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WorkkapMiddlewareLogger).forRoutes('*');
  }
}
