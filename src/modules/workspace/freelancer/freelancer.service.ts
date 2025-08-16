import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/libs/db/src';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';

@Injectable()
export class FreelancerService {
  constructor(private readonly prisma: PrismaService) { }

  getFreelancerData() {
    return { message: 'freelancer workspace' };
  }

  async updateProfile(userId: string, { skills, certifications, education }: UpdateFreelancerProfileDto) {
    return await this.prisma.freelancer.update({
      where: { uid: userId },
      // data: { skills, certifications, education }, // This will be fixed after running prisma migrate
      data: { skills },
    });
  }

  async getFreelancer(userId: string) {
    return await this.prisma.freelancer.findUnique({
      where: { uid: userId },
      include: { user: true },
    });
  }

  async getFreelancers() {
    return await this.prisma.freelancer.findMany({
      include: { user: true },
    });
  }
}
