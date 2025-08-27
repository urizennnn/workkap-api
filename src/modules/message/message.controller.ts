import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedsAuth, ValidateSchema } from 'src/libs';
import { MessageService } from './message.service';
import * as v from 'valibot';

const GetMessagesParamsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Conversation name is required')),
});

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':name')
  @NeedsAuth()
  @ValidateSchema({ params: GetMessagesParamsSchema })
  getMessages(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
    @Query('markRead') markReadQ?: string,
  ) {
    try {
      const userId =
        req.user && typeof req.user === 'object'
          ? ((req.user as any).userId ?? (req.user as any).sub)
          : undefined;

      if (!userId) throw new BadRequestException('Unable to resolve user id');

      const page = pageQ ? Math.max(1, Number(pageQ)) : undefined;
      const limit = limitQ
        ? Math.min(200, Math.max(1, Number(limitQ)))
        : undefined;
      if (
        (pageQ && Number.isNaN(Number(pageQ))) ||
        (limitQ && Number.isNaN(Number(limitQ)))
      ) {
        throw new BadRequestException('Invalid pagination params');
      }

      const markRead = markReadQ === undefined ? true : markReadQ !== 'false';

      return this.messageService.getConversationForUser(name, userId, {
        page,
        limit,
        markRead,
      });
    } catch (err) {
      throw new BadRequestException('Invalid request');
    }
  }
}
