import { Controller, Post } from '@nestjs/common';
import { SocketDocs } from 'libs';

@Controller('socket')
@SocketDocs.controller
export class SocketController {
  @Post('send-message')
  @SocketDocs.sendMessage
  sendMessage() {
    return { message: 'Documentation endpoint' };
  }

  @Post('read-messages')
  @SocketDocs.readMessages
  readMessages() {
    return { message: 'Documentation endpoint' };
  }
}
