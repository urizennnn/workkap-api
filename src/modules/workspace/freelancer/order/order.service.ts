import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  PrismaService,
  WorkkapLogger,
  normalizeAndThrowHttpError,
} from 'src/libs';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
  ) {}

  async listOrders(userId: string) {
    try {
      const freelancer = await this.prisma.freelancer.findUnique({
        where: { uid: userId },
      });
      if (!freelancer) {
        this.logger.warn(`Freelancer not found for user ID: ${userId}`);
        throw new NotFoundException('Freelancer not found');
      }
      this.logger.info(`Fetching orders for freelancer ID: ${freelancer.id}`);
      const orders = await this.prisma.order.findMany({
        where: { freelancerId: freelancer.id },
        include: {
          gig: true,
          client: {
            include: {
              user: true,
            },
          },
          modeOfWorking: {
            include: {
              hourlyRate: true,
              contract: true,
            },
          },
        },
      });
      this.logger.info(
        `Found ${orders.length} orders for freelancer ID: ${freelancer.id}`,
      );
      const results = {
        active: orders
          .filter((order) => order.status === OrderStatus.ACTIVE)
          .map((order) => ({
            ...order,
            clientName: order.client.user.fullName,
          })),
        late: orders
          .filter((order) => order.status === OrderStatus.LATE)
          .map((order) => ({
            ...order,
            clientName: order.client.user.fullName,
          })),
        completed: orders
          .filter((order) => order.status === OrderStatus.COMPLETED)
          .map((order) => ({
            ...order,
            clientName: order.client.user.fullName,
          })),
        pending: orders
          .filter((order) => order.status === OrderStatus.PENDING)
          .map((order) => ({
            ...order,
            clientName: order.client.user.fullName,
          })),
        cancelled: orders
          .filter((order) => order.status === OrderStatus.CANCELLED)
          .map((order) => ({
            ...order,
            clientName: order.client.user.fullName,
          })),
      };
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch orders for user "${userId}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to fetch orders',
      );
    }
  }
}
