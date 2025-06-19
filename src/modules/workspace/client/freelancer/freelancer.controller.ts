import { Controller, Get } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { NeedsClientAuth } from 'libs';

@Controller()
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @NeedsClientAuth()
  @Get()
  async getFreelancers() {
    return this.freelancerService.getFreelancers();
  }
}
