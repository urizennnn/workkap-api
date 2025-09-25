import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { errorSchema } from './error-schema';

export const OrderControllerSwagger = {
  controller: applyDecorators(ApiTags('Orders'), ApiBearerAuth()),

  getOrders: applyDecorators(
    ApiOperation({
      summary: 'List all jobs created by the authenticated client',
      description: 'GET /api/workspace/client/order',
    }),
    ApiOkResponse({
      description: 'Orders for the client',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: { type: 'array', items: { type: 'object' } },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),

  getOpenOrders: applyDecorators(
    ApiOperation({
      summary: 'List open jobs for the authenticated client',
      description: 'GET /api/workspace/client/order/open',
    }),
    ApiOkResponse({
      description: 'Open orders for the client',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: { type: 'array', items: { type: 'object' } },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),

  createOrder: applyDecorators(
    ApiOperation({
      summary: 'Create a new order',
      description: 'POST /api/workspace/client/order/create',
    }),
    ApiCreatedResponse({
      description: 'Order created',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Order created successfully' },
          data: { type: 'object' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
    ApiBadRequestResponse({
      description: 'Invalid order data',
      schema: errorSchema('Invalid order data'),
    }),
    ApiBody({
      description: 'Order details',
      required: true,
      schema: {
        type: 'object',
        properties: {
          freelancerId: { type: 'string' },
          gigId: { type: 'string' },
          modeOfWorking: {
            type: 'object',
            properties: {
              hourlyRate: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  maxAmount: { type: 'number' },
                },
              },
              contract: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          jobBrief: { type: 'string' },
          keyResponsibilities: {
            type: 'array',
            items: { type: 'string' },
          },
          payment: {
            type: 'string',
            enum: Object.keys(PaymentMethod),
          },
        },
        required: ['freelancerId', 'gigId', 'modeOfWorking', 'payment'],
      },
    }),
  ),

  payFreelancer: applyDecorators(
    ApiOperation({
      summary: 'Initialize payment for an existing order',
      description: 'POST /api/workspace/client/order/pay/:orderId',
    }),
    ApiOkResponse({
      description: 'Payment initialized',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: {
            type: 'string',
            example: 'Payment initialized successfully',
          },
          data: { type: 'object' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
    ApiNotFoundResponse({
      description: 'Order or freelancer not found',
      schema: errorSchema('Order not found'),
    }),
    ApiParam({ name: 'orderId', description: 'Order ID to pay for' }),
  ),
};
