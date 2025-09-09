import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SocketDocs } from 'src/libs';
import { MessageService } from './message.service';
import {
  SendMessageSchema,
  SendMessageSchemaType,
  MarkMessagesReadSchema,
  MarkMessagesReadSchemaType,
} from './dto';
import { NeedsAuth, ValidateSchema } from 'src/libs';
import type { AuthorizedRequest } from 'src/libs/@types/express';
import { MessageGateway } from './message.gateway';

@Controller('socket')
@SocketDocs.controller
export class SocketController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageGateway: MessageGateway,
  ) {}

  @Post('send-message')
  @NeedsAuth()
  @ValidateSchema({ body: SendMessageSchema })
  @SocketDocs.sendMessage
  async sendMessage(@Req() req: Request, @Body() body: SendMessageSchemaType) {
    const userId = (req as AuthorizedRequest).user.userId;
    const message = await this.messageService.sendMessage(userId, body);

    this.messageGateway.server.to(userId).emit('new_message', message);
    this.messageGateway.server
      .to(message.receiverId)
      .emit('new_message', message);

    const count = await this.messageService.countUnreadMessages(
      message.receiverId,
    );
    this.messageGateway.server
      .to(message.receiverId)
      .emit('unread_count', { count });

    return message;
  }

  @Post('read-messages')
  @NeedsAuth()
  @ValidateSchema({ body: MarkMessagesReadSchema })
  @SocketDocs.readMessages
  async readMessages(
    @Req() req: Request,
    @Body() body: MarkMessagesReadSchemaType,
  ) {
    const userId = (req as AuthorizedRequest).user.userId;
    const { conversationId } = body;
    await this.messageService.markMessagesAsReadForConversation(
      conversationId,
      userId,
    );
    const count = await this.messageService.countUnreadMessages(userId);
    return { unreadCount: count };
  }
}

