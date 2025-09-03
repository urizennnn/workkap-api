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
import {
    NeedsAuth,
  NeedsFreelancerAuth,
  ValidateSchema,
} from 'src/libs/common/decorators';
import { Freelancer, User } from '@prisma/client';
import { AuthorizedRequest } from 'src/libs/@types/express';

@Controller()
@FreelancerWorkspaceDocs.controller
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @FreelancerWorkspaceDocs.getData
  @NeedsFreelancerAuth()
  @Get()
  getData() {
    return this.freelancerService.getFreelancerData();
  }

  @FreelancerWorkspaceDocs.updateProfile
  @Put('profile')
  @NeedsFreelancerAuth()
  @ValidateSchema({ body: UpdateFreelancerProfileSchema })
  async updateProfile(
    @Req() req: any,
    @Body() body: UpdateFreelancerProfileDto,
  ): Promise<Freelancer> {
    const userId = (req as AuthorizedRequest).user.userId;

    return await this.freelancerService.updateProfile(userId, body);
  }

  @FreelancerWorkspaceDocs.getFreelancers
  @NeedsAuth()
  @Get('all')
  async getFreelancers() {
    return await this.freelancerService.getFreelancers();
  }

  @FreelancerWorkspaceDocs.getFreelancer
  @NeedsAuth()
  @Get(':userId')
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
