import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderSchemaType } from './dto';
import { PrismaService, WorkkapLogger } from 'libs';
import { Order, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
  ) {}

  async createOrder(
    orderData: CreateOrderSchemaType,
    userId: string,
  ): Promise<Order> {
    try {
      const [user, client] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.client.findUnique({ where: { uid: userId } }),
      ]);

      if (!user) throw new NotFoundException('User not found');
      if (!client) throw new NotFoundException('Client not found');
      this.logger.info(`Creating order for user ID: ${userId}`);
      const order = await this.prisma.order.create({
        data: {
          freelancer: { connect: { id: orderData.freelancerId } },
          gig: { connect: { id: orderData.gigId } },
          client: { connect: { id: client.id } },
          modeOfWorking: {
            create: {
              hourlyRate: {
                create: {
                  amount: orderData.modeOfWorking.hourlyRate.amount,
                  maxAmount: orderData.modeOfWorking.hourlyRate.maxAmount,
                },
              },
              contract: {
                create: {
                  startDate: orderData.modeOfWorking.contract.startDate,
                  endDate: orderData.modeOfWorking.contract.endDate,
                },
              },
            },
          },
          payment: orderData.payment as PaymentMethod,
        },
      });
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order for user "${userId}"`, error);
      throw new NotFoundException('Unable to create order');
    }
  }
}
