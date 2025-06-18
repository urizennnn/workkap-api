import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfigFactory, pickFrom } from 'libs/config';
import { UserModule } from './user/user.module';
import { GlobalJWTModule } from 'libs/auth/jwt/jwt.module';
import {
  LoggerModule,
  PrismaModule,
  SlugModule,
  WorkkapMiddlewareLogger,
} from 'libs';
import { GigsModule } from './gigs/gigs.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    SlugModule,
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
    OrderModule,
    GigsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WorkkapMiddlewareLogger).forRoutes('*');
  }
}
