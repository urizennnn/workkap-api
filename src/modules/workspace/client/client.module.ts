import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { OrderModule } from './order/order.module';
import { RegisterModule } from 'libs';
import { FreelancerModule } from './freelancer/freelancer.module';

@Module({
  imports: [
    OrderModule,
    FreelancerModule,
    RegisterModule('workspace/client', [OrderModule, FreelancerModule]),
  ],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}
