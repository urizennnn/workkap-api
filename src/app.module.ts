import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule, WorkkapMiddlewareLogger } from 'libs/common/logger';
import { ConfigModule } from '@nestjs/config';
import { appConfigFactory } from 'libs/config';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfigFactory] }),
    LoggerModule,
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
