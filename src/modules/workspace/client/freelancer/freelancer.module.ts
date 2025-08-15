import { Module } from '@nestjs/common';
import { FreelancerController } from './freelancer.controller';
import { FreelancerService } from './freelancer.service';
import { JWTService } from 'src/libs';

@Module({
  imports: [],
  controllers: [FreelancerController],
  providers: [FreelancerService, JWTService],
})
export class FreelancerModule {}
