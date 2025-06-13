import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { pickFrom } from 'libs/config';
import { PrismaModule } from 'libs/db';
import { GoogleAuthModule } from 'libs/auth/google';
import { JWTService } from 'libs/auth';

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
