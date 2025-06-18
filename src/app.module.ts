import { MiddlewareConsumer, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfigFactory, pickFrom } from 'libs/config';
import { UserModule } from './modules/user/user.module';
import { GlobalJWTModule } from 'libs/auth/jwt/jwt.module';
import {
  LoggerModule,
  PrismaModule,
  SlugModule,
  WorkkapMiddlewareLogger,
} from 'libs';
import { OrderModule } from './modules/order/order.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ClientModule } from './modules/workspace/client/client.module';
import { FreelancerModule } from './modules/workspace/freelancer/freelancer.module';
import { GigsModule } from './modules/workspace/freelancer/gigs/gigs.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'workspace',
        module: WorkspaceModule,
        children: [
          { path: 'client', module: ClientModule },
          {
            path: 'freelancer',
            module: FreelancerModule,
            children: [{ path: 'gigs', module: GigsModule }],
          },
        ],
      },
    ]),
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
    WorkspaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WorkkapMiddlewareLogger).forRoutes('*');
  }
}
