import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { errorSchema } from './error-schema';

export const WorkspaceControllerSwagger = {
  controller: applyDecorators(ApiTags('Workspace')),
  getRoot: applyDecorators(
    ApiOperation({ summary: 'Workspace root endpoint' }),
    ApiOkResponse({
      description: 'Confirmation message',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'workspace module' },
        },
      },
    }),
  ),
};

export const ClientControllerSwagger = {
  controller: applyDecorators(ApiTags('Client Workspace')),
  getData: applyDecorators(
    ApiOperation({ summary: 'Get client workspace data' }),
    ApiOkResponse({
      description: 'Client workspace information',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'client workspace' },
        },
      },
    }),
  ),
};

export const FreelancerWorkspaceControllerSwagger = {
  controller: applyDecorators(ApiTags('Freelancer Workspace')),
  getData: applyDecorators(
    ApiOperation({ summary: 'Get freelancer workspace data' }),
    ApiOkResponse({
      description: 'Freelancer workspace information',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'freelancer workspace' },
        },
      },
    }),
  ),
};

export const FreelancerOrdersControllerSwagger = {
  controller: applyDecorators(ApiTags('Freelancer Orders')),
  fetchOrders: applyDecorators(
    ApiOperation({ summary: 'List orders for the authenticated freelancer' }),
    ApiOkResponse({
      description: 'Orders grouped by status',
      schema: { type: 'object' },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),
};

export const ClientFreelancerControllerSwagger = {
  controller: applyDecorators(ApiTags('Client Freelancers')),
  getFreelancers: applyDecorators(
    ApiOperation({ summary: 'Retrieve all freelancers with their gigs' }),
    ApiOkResponse({
      description: 'List of freelancers',
      schema: { type: 'array', items: { type: 'object' } },
    }),
  ),
};
