import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleAuthModule, JWTService, pickFrom, PrismaModule } from 'libs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        databaseUrl: pickFrom(configService, 'db.url', 'app'),
      }),
      inject: [ConfigService],
    }),
    GoogleAuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, JWTService],
})
export class UserModule {}
