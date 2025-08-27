import { Request } from 'express';
import { Controller, Get, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { NeedsFreelancerAuth, FreelancerOrderDocs } from 'src/libs';
import type { AuthorizedRequest } from 'src/libs/@types/express';

@Controller()
@FreelancerOrderDocs.controller
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @NeedsFreelancerAuth()
  @Get('fetch')
  @FreelancerOrderDocs.fetchOrders
  async fetchOrders(@Req() req: Request) {
    const user = req.user as AuthorizedRequest['user'];
    return this.orderService.listOrders(user.userId);
  }
}
