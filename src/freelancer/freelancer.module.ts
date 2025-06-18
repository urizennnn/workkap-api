import { Module } from '@nestjs/common';
import { FreelancerController } from './freelancer.controller';
import { UserModule } from '../user/user.module';
import { GigsModule } from '../gigs/gigs.module';

@Module({
  imports: [UserModule, GigsModule],
  controllers: [FreelancerController],
})
export class FreelancerModule {}
