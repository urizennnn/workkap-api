import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { UserModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [UserModule, OrderModule],
  controllers: [ClientController],
})
export class ClientModule {}
