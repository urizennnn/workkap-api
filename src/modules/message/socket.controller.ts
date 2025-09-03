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

@Controller('socket')
@SocketDocs.controller
export class SocketController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send-message')
  @NeedsAuth()
  @ValidateSchema({ body: SendMessageSchema })
  @SocketDocs.sendMessage
  async sendMessage(@Req() req: Request, @Body() body: SendMessageSchemaType) {
    const userId = (req as AuthorizedRequest).user.userId;
    const message = await this.messageService.sendMessage(userId, body);
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

