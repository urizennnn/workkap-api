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
  ): Promise<any> {
    try {
      const conversation = await this.getConversationById(
        payload.conversationId,
      );
      if (conversation.aId !== senderId && conversation.bId !== senderId) {
        throw new ForbiddenException('Not a participant of this conversation');
      }
      const receiverId =
        conversation.aId === senderId ? conversation.bId : conversation.aId;
      const attachments = payload.attachments ?? [];
      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          receiverId,
          content: payload.content ?? '',
          attachments: attachments.length ? JSON.stringify(attachments) : null,
          isRead: false,
        },
      });
      await this.redis.cacheMessage(`conversation:${conversation.id}`, message);
      const result: any = { ...message };
      if ((message as any).attachments) {
        try {
          result.attachments = JSON.parse((message as any).attachments);
        } catch {
          result.attachments = [];
        }
      }
      return result;
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
    messages: any[];
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
  ): Promise<{ messages: any[]; unreadCount: number }> {
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

      const parsedMessages = (messages as any[]).map((m) => {
        const mm: any = { ...m };
        if (m.attachments) {
          try {
            mm.attachments = JSON.parse(m.attachments);
          } catch {
            mm.attachments = [];
          }
        }
        return mm;
      });

      const unreadCount = await this.countUnreadMessages(userId);
      return { messages: parsedMessages, unreadCount };
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

  async listUserConversations(userId: string): Promise<{
    conversations: Array<{
      id: string;
      topic: string | null;
      participants: { selfId: string; otherId: string };
      otherUser: {
        id: string;
        email: string | null;
        fullName: string | null;
        username: string | null;
      };
      lastMessage: any | null;
      unreadCount: number;
      lastActivityAt: Date;
    }>;
    totalUnreadCount: number;
  }> {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: { OR: [{ aId: userId }, { bId: userId }] },
      });

      if (!conversations.length)
        return { conversations: [], totalUnreadCount: 0 };

      const conversationIds = conversations.map((c) => c.id);
      const otherUserIds = Array.from(
        new Set(conversations.map((c) => (c.aId === userId ? c.bId : c.aId))),
      );

      const unreadGrouped = await this.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          receiverId: userId,
          isRead: false,
          conversationId: { in: conversationIds },
        },
        _count: { _all: true },
      });
      const unreadMap = new Map<string, number>(
        unreadGrouped.map((g) => [g.conversationId, g._count._all]),
      );

      const users = await this.prisma.user.findMany({
        where: { id: { in: otherUserIds } },
        select: { id: true, email: true, fullName: true, username: true },
      });
      const userMap = new Map<string, (typeof users)[number]>(
        users.map((u) => [u.id, u]),
      );

      const latestMessages = await this.prisma.message.findMany({
        where: { conversationId: { in: conversationIds } },
        orderBy: { createdAt: 'desc' },
      });
      const lastByConv = new Map<string, Message>();
      for (const m of latestMessages) {
        if (!lastByConv.has(m.conversationId))
          lastByConv.set(m.conversationId, m);
      }

      const items = conversations
        .map((c) => {
          const otherId = c.aId === userId ? c.bId : c.aId;
          const otherUser =
            userMap.get(otherId) ??
            ({
              id: otherId,
              email: null,
              fullName: null,
              username: null,
            } as const);
          const rawLastMessage = lastByConv.get(c.id) ?? null;
          let lastMessage: any = null;
          if (rawLastMessage) {
            lastMessage = { ...rawLastMessage } as any;
            if ((rawLastMessage as any).attachments) {
              try {
                lastMessage.attachments = JSON.parse(
                  (rawLastMessage as any).attachments,
                );
              } catch {
                lastMessage.attachments = [];
              }
            }
          }
          const unreadCount = unreadMap.get(c.id) ?? 0;
          const lastActivityAt =
            lastMessage?.createdAt ?? c.updatedAt ?? c.createdAt;
          return {
            id: c.id,
            topic: c.topic ?? null,
            participants: { selfId: userId, otherId },
            otherUser,
            lastMessage,
            unreadCount,
            lastActivityAt,
          };
        })
        .sort(
          (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
        );

      const totalUnreadCount = unreadGrouped.reduce(
        (sum, g) => sum + g._count._all,
        0,
      );

      return { conversations: items, totalUnreadCount };
    } catch (error) {
      this.logger.error(
        'Failed to list user conversations for "%s"',
        userId,
        error,
      );
      throw new InternalServerErrorException('Unable to list conversations');
    }
  }
}

