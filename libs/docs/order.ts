import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { errorSchema } from './error-schema';

export const OrderControllerSwagger = {
  controller: applyDecorators(ApiTags('Orders')),

  createOrder: applyDecorators(
    ApiOperation({ summary: 'Create a new order' }),
    ApiCreatedResponse({
      description: 'Order created',
      schema: { type: 'object' },
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
          payment: {
            type: 'string',
            enum: Object.keys(PaymentMethod),
          },
        },
        required: ['freelancerId', 'gigId', 'modeOfWorking', 'payment'],
      },
    }),
  ),
};
