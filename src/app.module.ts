import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfigFactory, pickFrom } from 'src/libs/config';
import { UserModule } from './modules/user/user.module';
import { GlobalJWTModule } from 'src/libs/auth/jwt/jwt.module';
import {
  LoggerModule,
  PrismaModule,
  SlugModule,
  WorkkapMiddlewareLogger,
  RedisModule,
} from 'src/libs';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [
    SlugModule,

    ConfigModule.forRoot({ isGlobal: true, load: [appConfigFactory] }),
    GlobalJWTModule.initAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: pickFrom(config, 'jwt.secret', 'app'),
        expireIn: pickFrom(config, 'jwt.expires_in', 'app'),
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
    RedisModule,
    UserModule,
    WorkspaceModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WorkkapMiddlewareLogger)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
