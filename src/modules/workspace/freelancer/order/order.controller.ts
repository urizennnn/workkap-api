import { Request } from 'express';
import { Controller, Post, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtPayload, NeedsFreelancerAuth } from 'libs';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @NeedsFreelancerAuth()
  @Post('fetch')
  async fetchOrders(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.orderService.listOrders(user.userId);
  }
}
