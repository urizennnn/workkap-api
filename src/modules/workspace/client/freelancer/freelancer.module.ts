import { Module } from '@nestjs/common';
import { FreelancerController } from './freelancer.controller';
import { FreelancerService } from './freelancer.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [FreelancerController],
  providers: [FreelancerService, JwtService],
})
export class FreelancerModule {}
