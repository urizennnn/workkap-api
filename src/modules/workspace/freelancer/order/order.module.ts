import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { JWTService } from 'src/libs';

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [OrderService, JWTService],
})
export class OrderModule {}
