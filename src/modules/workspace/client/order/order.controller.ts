import { Body, Controller, Post, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { CreateOrderSchema, CreateOrderSchemaType } from './dto';
import {
  JwtPayload,
  ValidateSchema,
  OrderDocs,
  NeedsFreelancerAuth,
} from 'src/libs';

@Controller()
@OrderDocs.controller
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @OrderDocs.createOrder
  @Post('create')
  @NeedsFreelancerAuth()
  @ValidateSchema({
    body: CreateOrderSchema,
  })
  async createOrder(@Req() req: Request, @Body() body: CreateOrderSchemaType) {
    const user = req.user as JwtPayload;
    return this.orderService.createOrder(body, user.userId);
  }
}
