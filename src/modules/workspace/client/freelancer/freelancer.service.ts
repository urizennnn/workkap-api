import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/libs';
import { FreelancerLevel, OrderStatus } from '@prisma/client';

@Injectable()
export class FreelancerService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFreelancers() {
    try {
      const freelancers = await this.prismaService.freelancer.findMany({
        include: {
          gigs: true,
        },
      });
      for (const freelancer of freelancers) {
        const completed = await this.prismaService.order.count({
          where: { freelancerId: freelancer.id, status: OrderStatus.COMPLETED },
        });
        await this.prismaService.freelancer.update({
          where: { id: freelancer.id },
          data: {
            jobsCompleted: completed,
            level:
              completed <= 3
                ? FreelancerLevel.NEW_SELLER
                : completed <= 10
                  ? FreelancerLevel.RISING_TALENT
                  : completed <= 30
                    ? FreelancerLevel.PRO_SELLER
                    : completed <= 100
                      ? FreelancerLevel.TOP_RATED
                      : FreelancerLevel.ELITE_SELLER,
            newSeller: completed <= 3,
          },
        });
      }
      const freelancersWithGigId = await this.prismaService.freelancer.findMany(
        {
          include: { gigs: true },
        },
      );
      return freelancersWithGigId.map((freelancer) => ({
        ...freelancer,
        gigId: freelancer.gigs.length > 0 ? freelancer.gigs[0].id : null,
      }));
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      throw new Error('Could not fetch freelancers');
    }
  }
}
