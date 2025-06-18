import { Module } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerController } from './freelancer.controller';
import { GigsModule } from './gigs/gigs.module';
import { RegisterModule } from 'libs';

@Module({
  imports: [GigsModule, RegisterModule('freelancer', [GigsModule])],
  providers: [FreelancerService],
  controllers: [FreelancerController],
})
export class FreelancerModule {}
