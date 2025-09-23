import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderSchemaType } from './dto';
import {
  PrismaService,
  WorkkapLogger,
  PaymentService,
  normalizeAndThrowHttpError,
} from 'src/libs';
import { MessageService } from '../../../message/message.service';
import { Order, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PaystackInitializeResponse } from 'src/libs/paystack/types';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly messageService: MessageService,
    private readonly paymentService: PaymentService,
  ) {}

  private readonly orderInclude: Prisma.OrderInclude = {
    freelancer: {
      include: {
        user: true,
      },
    },
    gig: true,
    modeOfWorking: {
      include: {
        hourlyRate: true,
        contract: true,
      },
    },
    payments: true,
  };

  private async getClientOrThrow(userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { uid: userId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async getOrders(userId: string) {
    const client = await this.getClientOrThrow(userId);
    return this.prisma.order.findMany({
      where: { clientId: client.id },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpenOrders(userId: string) {
    const client = await this.getClientOrThrow(userId);
    return this.prisma.order.findMany({
      where: {
        clientId: client.id,
        status: {
          in: [OrderStatus.ACTIVE, OrderStatus.PENDING, OrderStatus.LATE],
        },
      },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(
    orderData: CreateOrderSchemaType,
    userId: string,
  ): Promise<{ order: Order }> {
    try {
      const [user, client, gig, freelancer] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.client.findUnique({ where: { uid: userId } }),
        this.prisma.gig.findUnique({ where: { id: orderData.gigId } }),
        this.prisma.freelancer.findUnique({
          where: { id: orderData.freelancerId },
        }),
      ]);
      if (!user) throw new NotFoundException('User not found');
      if (!client) throw new NotFoundException('Client not found');
      this.logger.info(`Creating order for user ID: ${userId}`);
      const order = await this.prisma.order.create({
        data: {
          freelancer: { connect: { id: orderData.freelancerId } },
          gig: { connect: { id: orderData.gigId } },
          client: { connect: { id: client.id } },
          note: orderData.note ? orderData.note : null,
          jobBrief: orderData.jobBrief ?? null,
          keyResponsibilities: orderData.keyResponsibilities ?? [],
          total: orderData.total,
          modeOfWorking: {
            create: {
              ...(orderData.modeOfWorking &&
              'hourlyRate' in orderData.modeOfWorking &&
              orderData.modeOfWorking.hourlyRate
                ? {
                    hourlyRate: {
                      create: {
                        amount: orderData.modeOfWorking.hourlyRate.amount,
                        maxAmount: orderData.modeOfWorking.hourlyRate.maxAmount,
                      },
                    },
                  }
                : {}),
              ...(orderData.modeOfWorking &&
              'contract' in orderData.modeOfWorking &&
              orderData.modeOfWorking.contract
                ? {
                    contract: {
                      create: {
                        startDate: orderData.modeOfWorking.contract.startDate,
                        endDate: orderData.modeOfWorking.contract.endDate,
                      },
                    },
                  }
                : {}),
            },
          },
          payment: orderData.payment as PaymentMethod,
        },
      });
      if (gig && freelancer) {
        await this.messageService.getOrCreateConversation(
          userId,
          freelancer.uid,
          gig.title,
          `order:${order.id}`,
        );
      }
      return { order };
    } catch (error) {
      this.logger.error(`Failed to create order for user "${userId}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to create order',
      );
    }
  }

  async payFreelancer(
    orderId: string,
    clientUserId: string,
  ): Promise<PaystackInitializeResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const client = await this.prisma.client.findUnique({
      where: { uid: clientUserId },
    });
    if (!client || client.id !== order.clientId) {
      throw new ForbiddenException(
        'You are not permitted to pay for this order',
      );
    }
    const freelancer = await this.prisma.freelancer.findUnique({
      where: { id: order.freelancerId },
    });
    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }
    const payment = await this.paymentService.initializePayment(
      freelancer.uid,
      order.total ?? 0,
      order.id,
    );
    return payment;
  }
}
