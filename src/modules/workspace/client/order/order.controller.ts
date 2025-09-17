import { Body, Controller, Get, Post, Req, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { CreateOrderSchema, CreateOrderSchemaType } from './dto';
import {
  JwtPayload,
  ValidateSchema,
  OrderDocs,
  NeedsClientAuth,
} from 'src/libs';

@Controller()
@OrderDocs.controller
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @OrderDocs.getOrders
  @Get()
  @NeedsClientAuth()
  async getOrders(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.orderService.getOrders(user.userId);
  }

  @OrderDocs.getOpenOrders
  @Get('open')
  @NeedsClientAuth()
  async getOpenOrders(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.orderService.getOpenOrders(user.userId);
  }

  @OrderDocs.createOrder
  @Post('create')
  @NeedsClientAuth()
  @ValidateSchema({
    body: CreateOrderSchema,
  })
  async createOrder(@Req() req: Request, @Body() body: CreateOrderSchemaType) {
    const user = req.user as JwtPayload;
    return this.orderService.createOrder(body, user.userId);
  }

  @OrderDocs.payFreelancer
  @Post('pay/:orderId')
  @NeedsClientAuth()
  async payFreelancer(@Req() req: Request, @Param('orderId') orderId: string) {
    const user = req.user as JwtPayload;
    return this.orderService.payFreelancer(orderId, user.userId);
  }
}
