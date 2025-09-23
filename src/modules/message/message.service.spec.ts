import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { UserType } from 'src/libs/auth/jwt/jwt.service';

const createPrismaMock = () => ({
  user: { findUnique: jest.fn() },
  client: { findFirst: jest.fn() },
  freelancer: { findFirst: jest.fn() },
  conversation: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
});

const createRedisMock = () => ({
  getMessages: jest.fn(),
});

const createLoggerMock = () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
});

describe('MessageService.getConversationBetweenUsers', () => {
  const selfId = 'b60c373e-79f5-43a2-aa6f-026e78d8bf6c';
  const otherId = '40a8777e-6bfa-45fa-bb79-91505aa355df';
  const contextKey = 'order:7c08529d-c0bc-499f-bec9-e1844760a60c';

  let prisma: ReturnType<typeof createPrismaMock>;
  let redis: ReturnType<typeof createRedisMock>;
  let logger: ReturnType<typeof createLoggerMock>;
  let service: MessageService;

  beforeEach(() => {
    prisma = createPrismaMock();
    redis = createRedisMock();
    logger = createLoggerMock();
    service = new MessageService(
      prisma as any,
      logger as any,
      redis as any,
    );

    redis.getMessages.mockResolvedValue([]);
    prisma.client.findFirst.mockResolvedValue(null);
    prisma.freelancer.findFirst.mockResolvedValue(null);
    prisma.message.updateMany.mockResolvedValue({ count: 0 });
    prisma.message.count.mockResolvedValue(0);
  });

  it('returns messages when the conversation exists', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: selfId })
      .mockResolvedValueOnce({ id: otherId });

    const conversation = {
      id: 'conversation-id',
      aId: otherId,
      bId: selfId,
      contextKey,
    };

    prisma.conversation.findFirst.mockResolvedValueOnce(conversation);

    const messages = [
      {
        id: 'message-id',
        conversationId: conversation.id,
        senderId: selfId,
        receiverId: otherId,
        attachments: JSON.stringify([{ url: 'https://cdn/test.png', type: 'image' }]),
      },
    ];
    prisma.message.findMany.mockResolvedValueOnce(messages as any);
    prisma.message.count.mockResolvedValueOnce(3);

    const result = await service.getConversationBetweenUsers(
      selfId,
      otherId,
      { page: 1, limit: 50, contextKey, correlationId: 'corr-123' },
      UserType.CLIENT,
    );

    expect(result.conversationId).toBe(conversation.id);
    expect(result.unreadCount).toBe(3);
    expect(result.messages).toEqual([
      expect.objectContaining({
        id: 'message-id',
        attachments: [{ url: 'https://cdn/test.png', type: 'image' }],
      }),
    ]);
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: conversation.id, receiverId: selfId, isRead: false },
      data: { isRead: true },
    });
  });

  it('throws NotFoundException when no conversation exists', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: selfId })
      .mockResolvedValueOnce({ id: otherId });

    prisma.conversation.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(
      service.getConversationBetweenUsers(selfId, otherId, { contextKey }, UserType.CLIENT),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for invalid participant id', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: selfId });

    await expect(
      service.getConversationBetweenUsers(selfId, 'invalid-id', { contextKey }, UserType.CLIENT),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws ForbiddenException when requester cannot be resolved', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.getConversationBetweenUsers(selfId, otherId, { contextKey }, UserType.CLIENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
