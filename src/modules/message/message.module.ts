import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { SocketController } from './socket.controller';
import { JWTService } from 'libs';

@Module({
  imports: [],
  controllers: [SocketController],
  providers: [MessageService, MessageGateway, JWTService],
  exports: [MessageService],
})
export class MessageModule {}
