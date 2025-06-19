import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { JWTService } from 'libs';

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [OrderService, JWTService],
})
export class OrderModule {}
