import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService, WorkkapLogger, RedisService } from 'src/libs';
import { Message } from '@prisma/client';
import { SendMessageSchemaType } from './dto';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly redis: RedisService,
  ) {}

  private conversationKey(a: string, b: string): string {
    return [a, b].sort().join(':');
  }

  async sendMessage(
    senderId: string,
    payload: SendMessageSchemaType,
  ): Promise<Message> {
    try {
      const message = await this.prisma.message.create({
        data: {
          name: payload.name,
          senderId,
          receiverId: payload.receiverId,
          content: payload.content,
          isRead: false,
        },
      });

      const pairKey = this.conversationKey(senderId, payload.receiverId);
      await Promise.allSettled([
        this.redis.cacheMessage(`pair:${pairKey}`, message),
        this.redis.cacheMessage(`name:${payload.name}`, message),
      ]);

      return message;
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }
  async getMessages(name: string): Promise<Message[]> {
    try {
      const cached = await this.redis.getMessages(`name:${name}`);
      if (cached.length) return cached as Message[];
    } catch (error) {
      this.logger.error('Redis get failed', error);
    }
    return this.prisma.message.findMany({
      where: { name },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markMessagesAsReadBetweenUsers(
    selfId: string,
    otherId: string,
  ): Promise<void> {
    await this.prisma.message.updateMany({
      where: { receiverId: selfId, senderId: otherId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnreadMessages(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getConversationBetweenUsers(
    selfId: string,
    otherId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
  ): Promise<{ messages: Message[]; unreadCount: number }> {
    try {
      const pairKey = this.conversationKey(selfId, otherId);

      let messages: Message[] = [];

      try {
        const cached = await this.redis.getMessages(`pair:${pairKey}`);
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
          'Redis unavailable while fetching pair "%s": %o',
          pairKey,
          err,
        );
      }

      if (!messages.length) {
        messages = await this.prisma.message.findMany({
          where: {
            OR: [
              { senderId: selfId, receiverId: otherId },
              { senderId: otherId, receiverId: selfId },
            ],
          },
          orderBy: { createdAt: 'asc' },
          ...(opts?.page && opts?.limit
            ? { skip: (opts.page - 1) * opts.limit, take: opts.limit }
            : {}),
        });
      }

      if (messages.length === 0) {
        return {
          messages: [],
          unreadCount: await this.countUnreadMessages(selfId),
        };
      }

      if (opts?.markRead !== false) {
        await this.markMessagesAsReadBetweenUsers(selfId, otherId);
      }

      const unreadCount = await this.countUnreadMessages(selfId);

      return { messages, unreadCount };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        'Failed to fetch conversation for "%s" <-> "%s"',
        selfId,
        otherId,
        error,
      );
      throw new InternalServerErrorException('Unable to fetch messages');
    }
  }

  async getConversationForUser(
    name: string,
    userId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
  ): Promise<{ messages: Message[]; unreadCount: number }> {
    const recent = await this.prisma.message.findFirst({
      where: { name, OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, receiverId: true },
    });
    if (recent) {
      const otherId =
        recent.senderId === userId ? recent.receiverId : recent.senderId;
      return this.getConversationBetweenUsers(userId, otherId, opts);
    }
    const page = opts?.page;
    const limit = opts?.limit;

    let messages: Message[] = [];
    try {
      const cached = await this.redis.getMessages(`name:${name}`);
      if (cached?.length) {
        if (page && limit) {
          const start = (page - 1) * limit;
          const end = start + limit;
          messages = (cached as Message[]).slice(start, end);
        } else {
          messages = cached as Message[];
        }
      }
    } catch (err) {
      this.logger.warn('Redis unavailable while fetching "%s": %o', name, err);
    }
    if (!messages.length) {
      messages = await this.prisma.message.findMany({
        where: { name },
        orderBy: { createdAt: 'asc' },
        ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      });
    }
    if (opts?.markRead !== false) {
      await this.prisma.message.updateMany({
        where: { name, receiverId: userId, isRead: false },
        data: { isRead: true },
      });
    }
    const unreadCount = await this.countUnreadMessages(userId);
    return { messages, unreadCount };
  }
}
