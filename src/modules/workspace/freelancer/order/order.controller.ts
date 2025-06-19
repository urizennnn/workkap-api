import { Request } from 'express';
import { Controller, Post, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { NeedsFreelancerAuth } from 'libs';
import type { AuthorizedRequest } from 'libs/@types/express';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @NeedsFreelancerAuth()
  @Post('fetch')
  async fetchOrders(@Req() req: Request) {
    const user = (req.user as AuthorizedRequest).user;
    return this.orderService.listOrders(user.userId);
  }
}
