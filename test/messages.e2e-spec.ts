import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Request } from 'express';
import { MessageController } from 'src/modules/message/message.controller';
import { MessageService } from 'src/modules/message/message.service';
import { PrismaService, RedisService, WorkkapLogger } from 'src/libs';
import { JwtGuard } from 'src/libs/auth/jwt/jwt.guard';
import { JWTService, UserType } from 'src/libs/auth/jwt/jwt.service';

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

describe('MessageController (e2e)', () => {
  const selfId = 'b60c373e-79f5-43a2-aa6f-026e78d8bf6c';
  const otherId = '40a8777e-6bfa-45fa-bb79-91505aa355df';
  const contextKey = 'order:7c08529d-c0bc-499f-bec9-e1844760a60c';

  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;
  let redis: ReturnType<typeof createRedisMock>;
  let logger: ReturnType<typeof createLoggerMock>;
  let jwtService: { verify: jest.Mock };

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  const bootstrap = async () => {
    prisma = createPrismaMock();
    redis = createRedisMock();
    logger = createLoggerMock();
    jwtService = { verify: jest.fn() };

    redis.getMessages.mockResolvedValue([]);
    prisma.client.findFirst.mockResolvedValue(null);
    prisma.freelancer.findFirst.mockResolvedValue(null);
    prisma.message.updateMany.mockResolvedValue({ count: 0 });
    prisma.message.count.mockResolvedValue(0);
    jwtService.verify.mockReturnValue({
      userId: selfId,
      sub: selfId,
      userType: UserType.CLIENT,
      isRefreshToken: false,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: WorkkapLogger, useValue: logger },
        { provide: JWTService, useValue: jwtService },
        JwtGuard,
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(
        new (class implements CanActivate {
          canActivate(context: ExecutionContext): boolean {
            const req = context.switchToHttp().getRequest<Request>();
            req.user = {
              userId: selfId,
              sub: selfId,
              userType: UserType.CLIENT,
            } as any;
            return true;
          }
        })(),
      )
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  };

  it('returns 200 when conversation exists', async () => {
    await bootstrap();

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

    prisma.message.findMany.mockResolvedValueOnce([
      {
        id: 'message-id',
        conversationId: conversation.id,
        senderId: selfId,
        receiverId: otherId,
        attachments: JSON.stringify([{ url: 'https://cdn/test.png', type: 'image' }]),
      },
    ] as any);
    prisma.message.count.mockResolvedValueOnce(2);

    const response = await request(app.getHttpServer())
      .get(`/messages/with/${otherId}?contextKey=${encodeURIComponent(contextKey)}`)
      .set('x-correlation-id', 'corr-200')
      .expect(200);

    expect(response.body).toMatchObject({
      conversationId: conversation.id,
      unreadCount: 2,
    });
    expect(Array.isArray(response.body.messages)).toBe(true);
  });

  it('returns 404 when conversation does not exist', async () => {
    await bootstrap();

    prisma.user.findUnique
      .mockResolvedValueOnce({ id: selfId })
      .mockResolvedValueOnce({ id: otherId });

    prisma.conversation.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await request(app.getHttpServer())
      .get(`/messages/with/${otherId}?contextKey=${encodeURIComponent(contextKey)}`)
      .expect(404);
  });
});
