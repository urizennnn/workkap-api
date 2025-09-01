import { Module } from '@nestjs/common';
import { FreelancerService } from './freelancer.service';
import { FreelancerController } from './freelancer.controller';
import { GigsModule } from './gigs/gigs.module';
import { JWTService, RegisterModule } from 'src/libs';
import { OrderModule } from './order/order.module';
import { PrismaModule } from 'src/libs/db/src';

@Module({
  imports: [
    GigsModule,
    OrderModule,
    RegisterModule('workspace/freelancer', [GigsModule, OrderModule]),
    PrismaModule,
  ],
  providers: [FreelancerService,JWTService],
  controllers: [FreelancerController],
})
export class FreelancerModule {}
