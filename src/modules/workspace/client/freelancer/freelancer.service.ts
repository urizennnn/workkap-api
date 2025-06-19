import { Injectable } from '@nestjs/common';
import { PrismaService } from 'libs';

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
      return freelancers;
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      throw new Error('Could not fetch freelancers');
    }
  }
}
