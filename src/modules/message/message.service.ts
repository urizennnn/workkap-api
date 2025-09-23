import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Conversation, Message, Prisma } from '@prisma/client';
import { PrismaService, RedisService, WorkkapLogger } from 'src/libs';
import { UserType } from 'src/libs/auth/jwt/jwt.service';
import { SendMessageSchemaType } from './dto';
import { isValidUuid } from './message.utils';

type ParticipantIdentifier = {
  canonical: string;
  aliases: string[];
  exists: boolean;
  source: 'user' | 'client' | 'freelancer' | null;
};

type ConversationFetchMeta = {
  correlationId?: string;
  selfId: string;
  otherId: string;
  contextKey: string;
  viewerType?: UserType;
};

type FetchOutcome =
  | 'success'
  | 'not_found'
  | 'forbidden'
  | 'bad_request'
  | 'conflict'
  | 'unavailable'
  | 'error';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly redis: RedisService,
  ) {}

  private readonly DEFAULT_CONTEXT_KEY = 'default';
  private readonly CONTEXT_KEY_REGEX = /^[a-zA-Z0-9:_-]{1,120}$/;

  private resolveContextKey(contextKey?: string | null): string {
    const trimmed = contextKey?.trim();
    if (!trimmed || !trimmed.length) return this.DEFAULT_CONTEXT_KEY;
    if (!this.CONTEXT_KEY_REGEX.test(trimmed)) {
      throw new BadRequestException('Invalid context key');
    }
    return trimmed;
  }

  private async resolveParticipant(
    identifier: string,
  ): Promise<ParticipantIdentifier> {
    const aliasSet = new Set<string>();
    aliasSet.add(identifier);

    const normalizedIdentifier = identifier.trim();
    aliasSet.add(normalizedIdentifier);

    let canonical = normalizedIdentifier;
    const identifierIsUuid = isValidUuid(normalizedIdentifier);

    const [user, client, freelancer] = await Promise.all([
      identifierIsUuid
        ? this.prisma.user.findUnique({
            where: { id: normalizedIdentifier },
            select: { id: true },
          })
        : Promise.resolve(null),
      identifierIsUuid
        ? this.prisma.client.findFirst({
            where: {
              OR: [
                { id: normalizedIdentifier },
                { uid: normalizedIdentifier },
              ],
            },
            select: { id: true, uid: true },
          })
        : Promise.resolve(null),
      identifierIsUuid
        ? this.prisma.freelancer.findFirst({
            where: {
              OR: [
                { id: normalizedIdentifier },
                { uid: normalizedIdentifier },
              ],
            },
            select: { id: true, uid: true },
          })
        : Promise.resolve(null),
    ]);

    if (client) {
      canonical = client.uid;
      aliasSet.add(client.id);
      aliasSet.add(client.uid);
    }

    if (freelancer) {
      canonical = freelancer.uid;
      aliasSet.add(freelancer.id);
      aliasSet.add(freelancer.uid);
    }

    if (user) {
      canonical = user.id;
      aliasSet.add(user.id);
    }

    return {
      canonical,
      aliases: Array.from(aliasSet),
      exists: Boolean(user || client || freelancer),
      source: user ? 'user' : client ? 'client' : freelancer ? 'freelancer' : null,
    };
  }

  private sortParticipants(
    a: ParticipantIdentifier,
    b: ParticipantIdentifier,
  ): [ParticipantIdentifier, ParticipantIdentifier] {
    if (a.canonical === b.canonical) return [a, b];
    return a.canonical < b.canonical ? [a, b] : [b, a];
  }

  private async normalizeConversationMessages(
    conversationId: string,
    first: ParticipantIdentifier,
    second: ParticipantIdentifier,
  ): Promise<void> {
    try {
      await Promise.all([
        this.prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { in: first.aliases },
          },
          data: { senderId: first.canonical },
        }),
        this.prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { in: second.aliases },
          },
          data: { senderId: second.canonical },
        }),
        this.prisma.message.updateMany({
          where: {
            conversationId,
            receiverId: { in: first.aliases },
          },
          data: { receiverId: first.canonical },
        }),
        this.prisma.message.updateMany({
          where: {
            conversationId,
            receiverId: { in: second.aliases },
          },
          data: { receiverId: second.canonical },
        }),
      ]);
    } catch (error) {
      this.logger.error(
        'Failed to normalize conversation "%s" participants',
        conversationId,
        error,
      );
    }
  }

  private async cleanupDuplicateConversations(
    canonical: Conversation,
    first: ParticipantIdentifier,
    second: ParticipantIdentifier,
    contextKey: string,
  ): Promise<void> {
    try {
      const duplicates = await this.prisma.conversation.findMany({
        where: {
          id: { not: canonical.id },
          contextKey,
          OR: [
            {
              AND: [
                { aId: { in: first.aliases } },
                { bId: { in: second.aliases } },
              ],
            },
            {
              AND: [
                { aId: { in: second.aliases } },
                { bId: { in: first.aliases } },
              ],
            },
          ],
        },
      });

      if (!duplicates.length) {
        await this.normalizeConversationMessages(canonical.id, first, second);
        return;
      }

      for (const duplicate of duplicates) {
        await this.prisma.$transaction([
          this.prisma.message.updateMany({
            where: { conversationId: duplicate.id },
            data: { conversationId: canonical.id },
          }),
          this.prisma.conversation.delete({ where: { id: duplicate.id } }),
        ]);
      }

      await this.normalizeConversationMessages(canonical.id, first, second);
    } catch (error) {
      this.logger.error(
        'Failed cleaning duplicate conversations for "%s" and "%s"',
        first.canonical,
        second.canonical,
        error,
      );
    }
  }

  private async findConversationWithAliases(
    participantA: ParticipantIdentifier,
    participantB: ParticipantIdentifier,
    contextKey: string,
  ): Promise<{
    conversation: Conversation | null;
    sorted: [ParticipantIdentifier, ParticipantIdentifier];
  }> {
    const [first, second] = this.sortParticipants(participantA, participantB);

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        aId: first.canonical,
        bId: second.canonical,
        contextKey,
      },
    });

    if (conversation) return { conversation, sorted: [first, second] };

    const fallback = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { aId: { in: first.aliases } },
              { bId: { in: second.aliases } },
              { contextKey },
            ],
          },
          {
            AND: [
              { aId: { in: second.aliases } },
              { bId: { in: first.aliases } },
              { contextKey },
            ],
          },
        ],
      },
    });

    if (!fallback) return { conversation: null, sorted: [first, second] };

    try {
      conversation = await this.prisma.conversation.update({
        where: { id: fallback.id },
        data: {
          aId: first.canonical,
          bId: second.canonical,
          contextKey,
        },
      });
      await this.normalizeConversationMessages(conversation.id, first, second);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        conversation = await this.prisma.conversation.findFirst({
          where: {
            aId: first.canonical,
            bId: second.canonical,
            contextKey,
          },
        });
        if (!conversation) throw error;
      } else {
        throw error;
      }
    }

    return { conversation, sorted: [first, second] };
  }

  async getOrCreateConversation(
    userA: string,
    userB: string,
    topic?: string | null,
    contextKey?: string | null,
  ): Promise<Conversation> {
    const resolvedContextKey = this.resolveContextKey(contextKey);
    const [participantA, participantB] = await Promise.all([
      this.resolveParticipant(userA),
      this.resolveParticipant(userB),
    ]);

    const {
      conversation,
      sorted: [first, second],
    } = await this.findConversationWithAliases(
      participantA,
      participantB,
      resolvedContextKey,
    );

    let canonicalConversation = conversation;

    if (!canonicalConversation) {
      try {
        canonicalConversation = await this.prisma.conversation.create({
          data: {
            aId: first.canonical,
            bId: second.canonical,
            topic: topic ?? undefined,
            contextKey: resolvedContextKey,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          canonicalConversation = await this.prisma.conversation.findFirst({
            where: {
              aId: first.canonical,
              bId: second.canonical,
              contextKey: resolvedContextKey,
            },
          });
          if (!canonicalConversation) throw error;
        } else {
          throw error;
        }
      }
    } else {
      const updates: Prisma.ConversationUpdateInput = {};
      if (topic && !canonicalConversation.topic) {
        updates.topic = topic;
      }
      if (canonicalConversation.contextKey !== resolvedContextKey) {
        updates.contextKey = resolvedContextKey;
      }
      if (Object.keys(updates).length) {
        canonicalConversation = await this.prisma.conversation.update({
          where: { id: canonicalConversation.id },
          data: updates,
        });
      }
    }

    await this.cleanupDuplicateConversations(
      canonicalConversation,
      first,
      second,
      resolvedContextKey,
    );

    return canonicalConversation;
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
    opts?: {
      page?: number;
      limit?: number;
      markRead?: boolean;
      contextKey?: string | null;
      correlationId?: string;
    },
    viewerType?: UserType,
  ): Promise<{
    messages: any[];
    unreadCount: number;
    conversationId: string;
  }> {
    const trimmedContextKey = opts?.contextKey?.trim();
    const meta: ConversationFetchMeta = {
      correlationId: opts?.correlationId,
      selfId,
      otherId,
      contextKey: trimmedContextKey && trimmedContextKey.length
        ? trimmedContextKey
        : this.DEFAULT_CONTEXT_KEY,
      viewerType,
    };
    const startedAt = Date.now();

    try {
      if (!isValidUuid(selfId)) {
        throw new BadRequestException('Invalid requester id');
      }

      if (!isValidUuid(otherId)) {
        throw new BadRequestException('Invalid participant id');
      }

      const selfParticipant = await this.resolveParticipant(selfId);
      if (!selfParticipant.exists) {
        throw new ForbiddenException('Requester is not a valid participant');
      }

      const otherParticipant = await this.resolveParticipant(otherId);
      if (!otherParticipant.exists) {
        throw new NotFoundException('Conversation participant not found');
      }

      const resolvedContextKey = this.resolveContextKey(opts?.contextKey);
      meta.contextKey = resolvedContextKey;

      const {
        conversation,
      } = await this.findConversationWithAliases(
        selfParticipant,
        otherParticipant,
        resolvedContextKey,
      );

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (
        conversation.aId !== selfParticipant.canonical &&
        conversation.bId !== selfParticipant.canonical
      ) {
        throw new ForbiddenException('Not a participant of this conversation');
      }

      const result = await this.getConversationMessages(
        conversation.id,
        selfParticipant.canonical,
        opts,
        viewerType,
      );
      const durationMs = Date.now() - startedAt;
      this.recordFetchMetrics(durationMs, 'success', meta);
      this.logSlowFetch(durationMs, meta);
      return { ...result, conversationId: conversation.id };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const httpError = this.toHttpError(error);
      const outcome = this.classifyOutcome(httpError ?? 'error');
      this.recordFetchMetrics(durationMs, outcome, meta, error);
      this.logSlowFetch(durationMs, meta);

      const normalizedError = this.normalizeError(error);

      if (httpError) {
        const logMethod = httpError.getStatus() >= 500
          ? this.logger.error.bind(this.logger)
          : this.logger.warn.bind(this.logger);
        logMethod(
          'Conversation fetch failed for "%s" <-> "%s" %o',
          selfId,
          otherId,
          { ...meta, durationMs, error: normalizedError },
          error instanceof Error ? error : undefined,
        );
        throw httpError;
      }

      this.logger.error(
        'Failed to fetch conversation for "%s" <-> "%s" %o',
        selfId,
        otherId,
        { ...meta, durationMs, error: normalizedError },
        error instanceof Error ? error : undefined,
      );
      throw new InternalServerErrorException('Unable to fetch messages');
    }
  }

  private classifyOutcome(error: HttpException | FetchOutcome): FetchOutcome {
    if (typeof error === 'string') return error;
    const status = error.getStatus();
    if (status === 400) return 'bad_request';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 503) return 'unavailable';
    if (status >= 200 && status < 300) return 'success';
    return 'error';
  }

  private recordFetchMetrics(
    durationMs: number,
    outcome: FetchOutcome,
    meta: ConversationFetchMeta,
    error?: unknown,
  ): void {
    this.logger.info('metric messages.fetch.duration_ms %o', {
      durationMs,
      outcome,
      correlationId: meta.correlationId ?? null,
      selfId: meta.selfId,
      otherId: meta.otherId,
      contextKey: meta.contextKey,
      viewerType: meta.viewerType ?? null,
    });

    if (outcome !== 'success') {
      this.logger.info('metric messages.fetch.errors_total %o', {
        outcome,
        correlationId: meta.correlationId ?? null,
        selfId: meta.selfId,
        otherId: meta.otherId,
        contextKey: meta.contextKey,
        viewerType: meta.viewerType ?? null,
        error: this.normalizeError(error),
      });
    }
  }

  private logSlowFetch(durationMs: number, meta: ConversationFetchMeta): void {
    if (durationMs <= 1000) return;
    this.logger.warn('Slow conversation fetch detected %o', {
      durationMs,
      correlationId: meta.correlationId ?? null,
      selfId: meta.selfId,
      otherId: meta.otherId,
      contextKey: meta.contextKey,
      viewerType: meta.viewerType ?? null,
    });
  }

  private normalizeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      const base: Record<string, unknown> = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      if ('code' in error) {
        base.code = (error as any).code;
      }
      if ('cause' in error) {
        base.cause = (error as any).cause;
      }
      return base;
    }

    if (typeof error === 'object' && error !== null) {
      return { ...error } as Record<string, unknown>;
    }

    return { name: 'UnknownError', message: String(error) };
  }

  private toHttpError(error: unknown): HttpException | null {
    if (error instanceof HttpException) {
      return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new ConflictException('Conversation already exists');
        case 'P2003':
          return new BadRequestException('Invalid conversation relation');
        case 'P2025':
          return new NotFoundException('Conversation not found');
        default:
          return null;
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new BadRequestException('Invalid request payload');
    }

    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      return new ServiceUnavailableException('Database temporarily unavailable');
    }

    return null;
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    opts?: { page?: number; limit?: number; markRead?: boolean },
    viewerType?: UserType,
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
    contextKey?: string | null,
  ): Promise<void> {
    const [selfParticipant, otherParticipant] = await Promise.all([
      this.resolveParticipant(selfId),
      this.resolveParticipant(otherId),
    ]);

    const resolvedContextKey = this.resolveContextKey(contextKey);
    const {
      conversation,
      sorted: [first, second],
    } = await this.findConversationWithAliases(
      selfParticipant,
      otherParticipant,
      resolvedContextKey,
    );

    if (!conversation) return;

    await this.cleanupDuplicateConversations(
      conversation,
      first,
      second,
      resolvedContextKey,
    );

    await this.markMessagesAsReadForConversation(
      conversation.id,
      selfParticipant.canonical,
    );
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

  async listUserConversations(
    userId: string,
    viewerType?: UserType,
  ): Promise<{
    conversations: Array<{
      id: string;
      topic: string | null;
      contextKey: string;
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

      const filteredConversations = conversations;

      const items = filteredConversations
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
            contextKey: c.contextKey,
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
