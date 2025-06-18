import { Module } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerController } from './freelancer.controller';
import { GigsModule } from './gigs/gigs.module';

@Module({
  imports: [GigsModule],
  providers: [FreelancerService],
  controllers: [FreelancerController],
})
export class FreelancerModule {}
