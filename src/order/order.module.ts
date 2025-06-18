import { Module } from '@nestjs/common';
import { OrderService } from './order.service';

@Module({
  imports: [],
  controllers: [OrderService],
  providers: [OrderModule],
})
export class OrderModule {}
