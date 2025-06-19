import { Controller, Get } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { NeedsClientAuth, ClientFreelancerDocs } from 'libs';

@Controller()
@ClientFreelancerDocs.controller
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @NeedsClientAuth()
  @Get()
  @ClientFreelancerDocs.getFreelancers
  async getFreelancers() {
    return this.freelancerService.getFreelancers();
  }
}
