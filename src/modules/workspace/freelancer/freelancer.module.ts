import { Module } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerController } from './freelancer.controller';
import { GigsModule } from './gigs/gigs.module';
import { RegisterModule } from 'libs';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    GigsModule,
    OrderModule,
    RegisterModule('freelancer', [GigsModule, OrderModule]),
  ],
  providers: [FreelancerService],
  controllers: [FreelancerController],
})
export class FreelancerModule {}
