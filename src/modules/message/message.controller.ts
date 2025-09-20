import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedsAuth, ValidateSchema } from 'src/libs';
import { MessageService } from './message.service';
import { MessageSwaggerController } from 'src/libs/docs/message';
import { GetConversationParamsSchema } from './dto';

@MessageSwaggerController.controller
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessageSwaggerController.getMessages
  @Get('with/:otherUserId')
  @NeedsAuth()
  @ValidateSchema({ params: GetConversationParamsSchema })
  getMessages(
    @Req() req: Request,
    @Param('otherUserId') otherUserId: string,
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
    @Query('markRead') markReadQ?: string,
    @Query('contextKey') contextKeyQ?: string,
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
      const contextKey = contextKeyQ?.trim()
        ? contextKeyQ.trim().slice(0, 120)
        : undefined;

      const userType =
        req.user && typeof req.user === 'object'
          ? ((req.user as any).userType ?? undefined)
          : undefined;
      return this.messageService.getConversationBetweenUsers(
        userId,
        otherUserId,
        { page, limit, markRead, contextKey },
        userType,
      );
    } catch {
      throw new BadRequestException('Invalid request');
    }
  }

  @MessageSwaggerController.getConversations
  @Get('conversations')
  @NeedsAuth()
  async getConversations(@Req() req: Request) {
    const userId =
      req.user && typeof req.user === 'object'
        ? ((req.user as any).userId ?? (req.user as any).sub)
        : undefined;

    if (!userId) throw new BadRequestException('Unable to resolve user id');
    const userType =
      req.user && typeof req.user === 'object'
        ? ((req.user as any).userType ?? undefined)
        : undefined;
    return this.messageService.listUserConversations(userId, userType);
  }
}
