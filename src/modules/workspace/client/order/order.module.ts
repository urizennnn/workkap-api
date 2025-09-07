import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { JWTService, PaymentModule } from 'src/libs';
import { MessageModule } from '../../../message/message.module';

@Module({
  imports: [MessageModule, PaymentModule],
  controllers: [OrderController],
  providers: [OrderService, JWTService],
})
export class OrderModule {}