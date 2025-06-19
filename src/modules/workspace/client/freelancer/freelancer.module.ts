import { Module } from '@nestjs/common';
import { FreelancerController } from './freelancer.controller';
import { FreelancerService } from './freelancer.service';
import { JWTService } from 'libs';

@Module({
  imports: [],
  controllers: [FreelancerController],
  providers: [FreelancerService, JWTService],
})
export class FreelancerModule {}
