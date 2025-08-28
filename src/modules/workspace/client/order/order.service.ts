import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderSchemaType } from './dto';
import { PrismaService, WorkkapLogger } from 'src/libs';
import { MessageService } from '../../../message/message.service';
import { Order, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly messageService: MessageService,
  ) {}

  async createOrder(
    orderData: CreateOrderSchemaType,
    userId: string,
  ): Promise<Order> {
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
        );
      }
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order for user "${userId}"`, error);
      throw new NotFoundException('Unable to create order');
    }
  }
}
