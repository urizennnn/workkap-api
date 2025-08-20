import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerWorkspaceDocs } from 'src/libs';
import {
  UpdateFreelancerProfileDto,
  UpdateFreelancerProfileSchema,
} from './dto/update-freelancer-profile.dto';
import { ValidateSchema } from 'src/libs/common/decorators';
import { Freelancer, User } from '@prisma/client';

@Controller()
@FreelancerWorkspaceDocs.controller
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @Get()
  @FreelancerWorkspaceDocs.getData
  getData() {
    return this.freelancerService.getFreelancerData();
  }

  @Put('profile')
  @ValidateSchema({ body: UpdateFreelancerProfileSchema })
  @FreelancerWorkspaceDocs.updateProfile
  async updateProfile(
    @Req() req: any,
    @Body() body: UpdateFreelancerProfileDto,
  ): Promise<Freelancer> {
    const userId = req.user.sub;
    return await this.freelancerService.updateProfile(userId, body);
  }

  @Get('all')
  @FreelancerWorkspaceDocs.getFreelancers
  async getFreelancers() {
    return await this.freelancerService.getFreelancers();
  }

  @Get(':userId')
  @FreelancerWorkspaceDocs.getFreelancer
  async getFreelancer(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<(Freelancer & { user: User }) | null> {
    const freelancer = await this.freelancerService.getFreelancer(userId);
    if (!freelancer) {
      return null;
    }
    return freelancer;
  }
}
