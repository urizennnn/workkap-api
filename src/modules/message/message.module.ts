import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { SocketController } from './socket.controller';
import { MessageController } from './message.controller';
import { JWTService } from 'src/libs';

@Module({
  imports: [],
  controllers: [SocketController, MessageController],
  providers: [MessageService, MessageGateway, JWTService],
  exports: [MessageService, MessageGateway],
})
export class MessageModule {}
