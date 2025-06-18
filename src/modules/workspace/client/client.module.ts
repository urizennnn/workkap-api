import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { OrderModule } from './order/order.module';
import { RegisterModule } from 'libs';

@Module({
  imports: [OrderModule, RegisterModule('client', [OrderModule])],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}
