import { Controller, Get } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerWorkspaceDocs } from 'src/libs';

@Controller()
@FreelancerWorkspaceDocs.controller
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @Get()
  @FreelancerWorkspaceDocs.getData
  getData() {
    return this.freelancerService.getFreelancerData();
  }
}
