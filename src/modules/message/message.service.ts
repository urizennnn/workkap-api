import { Injectable } from '@nestjs/common';
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
}
