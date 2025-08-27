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
      await this.redis.cacheMessage(payload.name, message);
      return message;
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }

  async getMessages(name: string): Promise<Message[]> {
    try {
      const cached = await this.redis.getMessages(name);
      if (cached.length) return cached as Message[];
    } catch (error) {
      this.logger.error('Redis get failed', error);
    }
    return this.prisma.message.findMany({
      where: { name },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markMessagesAsRead(name: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { name, receiverId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnreadMessages(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }
  async getConversationForUser(
    name: string,
    userId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
  ): Promise<{ messages: Message[]; unreadCount: number }> {
    try {
      const canView = await this.prisma.message.findFirst({
        where: {
          name,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { id: true },
      });
      if (!canView) {
        this.logger.warn(
          'Access denied for user "%s" to conversation "%s"',
          userId,
          name,
        );
        throw new ForbiddenException('You are not part of this conversation');
      }

      const page = opts?.page;
      const limit = opts?.limit;
      const markRead = opts?.markRead !== false;

      let messages: Message[] = [];

      try {
        const cached = await this.redis.getMessages(name);
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
        this.logger.warn(
          'Redis unavailable while fetching "%s": %o',
          name,
          err,
        );
      }
      if (!messages.length) {
        messages = await this.prisma.message.findMany({
          where: { name },
          orderBy: { createdAt: 'asc' },
          ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
        });
      }

      if (markRead) {
        await this.markMessagesAsRead(name, userId);
      }

      const unreadCount = await this.countUnreadMessages(userId);

      return { messages, unreadCount };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        'Failed to fetch conversation "%s" for user "%s"',
        name,
        userId,
        error,
      );
      throw new InternalServerErrorException('Unable to fetch messages');
    }
  }
}
