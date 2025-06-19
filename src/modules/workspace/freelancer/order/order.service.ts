import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, WorkkapLogger } from 'libs';

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
          client: true,
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
      return orders;
    } catch (error) {
      this.logger.error(`Failed to fetch orders for user "${userId}"`, error);
      throw new InternalServerErrorException('Unable to fetch orders');
    }
  }
}
