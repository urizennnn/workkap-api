import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Conversation, Message } from '@prisma/client';
import { PrismaService, RedisService, WorkkapLogger } from 'src/libs';
import { SendMessageSchemaType } from './dto';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly redis: RedisService,
  ) {}

  private sortPair(a: string, b: string): { aId: string; bId: string } {
    return a < b ? { aId: a, bId: b } : { aId: b, bId: a };
  }

  async getOrCreateConversation(
    userA: string,
    userB: string,
    topic?: string | null,
  ): Promise<Conversation> {
    const { aId, bId } = this.sortPair(userA, userB);
    const existing = await this.prisma.conversation.findFirst({
      where: { aId, bId },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { aId, bId, topic: topic ?? undefined },
    });
  }

  async getConversationById(id: string): Promise<Conversation> {
    const conv = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async sendMessage(
    senderId: string,
    payload: SendMessageSchemaType,
  ): Promise<Message> {
    try {
      const conversation = await this.getConversationById(
        payload.conversationId,
      );
      if (conversation.aId !== senderId && conversation.bId !== senderId) {
        throw new ForbiddenException('Not a participant of this conversation');
      }
      const receiverId =
        conversation.aId === senderId ? conversation.bId : conversation.aId;
      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          receiverId,
          content: payload.content,
          isRead: false,
        },
      });
      await this.redis.cacheMessage(`conversation:${conversation.id}`, message);
      return message;
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }

  async getConversationBetweenUsers(
    selfId: string,
    otherId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
  ): Promise<{
    messages: Message[];
    unreadCount: number;
    conversationId: string;
  }> {
    try {
      const conversation = await this.getOrCreateConversation(selfId, otherId);
      const result = await this.getConversationMessages(
        conversation.id,
        selfId,
        opts,
      );
      return { ...result, conversationId: conversation.id };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(
        'Failed to fetch conversation for "%s" <-> "%s"',
        selfId,
        otherId,
        error,
      );
      throw new InternalServerErrorException('Unable to fetch messages');
    }
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
  ): Promise<{ messages: Message[]; unreadCount: number }> {
    try {
      let messages: Message[] = [];
      try {
        const cached = await this.redis.getMessages(
          `conversation:${conversationId}`,
        );
        if (cached?.length) {
          if (opts?.page && opts?.limit) {
            const start = (opts.page - 1) * opts.limit;
            const end = start + opts.limit;
            messages = (cached as Message[]).slice(start, end);
          } else {
            messages = cached as Message[];
          }
        }
      } catch (err) {
        this.logger.warn(
          'Redis unavailable while fetching conversation "%s": %o',
          conversationId,
          err,
        );
      }

      if (!messages.length) {
        messages = await this.prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
          ...(opts?.page && opts?.limit
            ? { skip: (opts.page - 1) * opts.limit, take: opts.limit }
            : {}),
        });
      }

      if (opts?.markRead !== false) {
        await this.markMessagesAsReadForConversation(conversationId, userId);
      }

      const unreadCount = await this.countUnreadMessages(userId);
      return { messages, unreadCount };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        'Failed to fetch messages for conversation "%s"',
        conversationId,
        error,
      );
      throw new InternalServerErrorException('Unable to fetch messages');
    }
  }

  async markMessagesAsReadBetweenUsers(
    selfId: string,
    otherId: string,
  ): Promise<void> {
    const { aId, bId } = this.sortPair(selfId, otherId);
    const conv = await this.prisma.conversation.findFirst({
      where: { aId, bId },
    });
    if (!conv) return;
    await this.markMessagesAsReadForConversation(conv.id, selfId);
  }

  async markMessagesAsReadForConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.message.updateMany({
      where: { conversationId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnreadMessages(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
