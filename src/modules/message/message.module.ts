import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { JWTService } from 'libs';

@Module({
  imports: [],
  providers: [MessageService, MessageGateway, JWTService],
  exports: [MessageService],
})
export class MessageModule {}
