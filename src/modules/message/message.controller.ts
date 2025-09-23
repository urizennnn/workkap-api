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
import { isValidUuid } from './message.utils';

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
    const userId =
      req.user && typeof req.user === 'object'
        ? ((req.user as any).userId ?? (req.user as any).sub)
        : undefined;

    if (!userId) throw new BadRequestException('Unable to resolve user id');

    const pageValue = pageQ !== undefined ? Number(pageQ) : undefined;
    const limitValue = limitQ !== undefined ? Number(limitQ) : undefined;

    if (
      (pageQ !== undefined && (Number.isNaN(pageValue) || !Number.isFinite(pageValue))) ||
      (limitQ !== undefined &&
        (Number.isNaN(limitValue) || !Number.isFinite(limitValue)))
    ) {
      throw new BadRequestException('Invalid pagination params');
    }

    const page =
      pageValue !== undefined ? Math.max(1, Math.floor(pageValue)) : undefined;
    const limit =
      limitValue !== undefined
        ? Math.min(200, Math.max(1, Math.floor(limitValue)))
        : undefined;

    const markRead = markReadQ === undefined ? true : markReadQ !== 'false';
    const trimmedContextKey = contextKeyQ?.trim();
    const contextKey = trimmedContextKey?.length
      ? trimmedContextKey.slice(0, 120)
      : undefined;

    const correlationHeader = req.headers['x-correlation-id'];
    const correlationId = Array.isArray(correlationHeader)
      ? correlationHeader[0]
      : correlationHeader;

    if (!isValidUuid(otherUserId)) {
      throw new BadRequestException('Invalid participant id');
    }

    const userType =
      req.user && typeof req.user === 'object'
        ? ((req.user as any).userType ?? undefined)
        : undefined;

    return this.messageService.getConversationBetweenUsers(
      userId,
      otherUserId,
      { page, limit, markRead, contextKey, correlationId },
      userType,
    );
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
