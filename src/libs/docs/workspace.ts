import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiParam,
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
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'workspace module' },
            },
          },
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
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'client workspace' },
            },
          },
        },
      },
    }),
  ),
};

export const FreelancerWorkspaceControllerSwagger = {
  controller: applyDecorators(ApiTags('Freelancer Workspace'), ApiBearerAuth()),
  getData: applyDecorators(
    ApiOperation({ summary: 'Get freelancer workspace data' }),
    ApiOkResponse({
      description: 'Freelancer workspace information',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'freelancer workspace' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),
  updateProfile: applyDecorators(
    ApiOperation({ summary: "Update a freelancer's profile" }),
    ApiOkResponse({
      description: 'Profile updated successfully',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Profile updated successfully' },
          data: { type: 'object' },
        },
      },
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of freelancer skills',
            example: ['React', 'Node.js'],
          },
          profilePictureUrl: {
            type: 'string',
            format: 'uri',
            description: 'Public URL to the profile picture',
            example: 'https://cdn.example.com/profile.jpg',
          },
          certifications: {
            type: 'array',
            items: { type: 'string' },
            description: 'Professional certifications',
            example: ['AWS Certified Cloud Practitioner'],
          },
          education: {
            type: 'array',
            items: { type: 'string' },
            description: 'Education history',
            example: ['B.Sc. Computer Science'],
          },
        },
        required: ['skills', 'profilePictureUrl', 'certifications', 'education'],
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid payload',
      schema: errorSchema('Validation failed'),
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),
  getFreelancer: applyDecorators(
    ApiOperation({ summary: 'Get a freelancer by id' }),
    ApiOkResponse({
      description: 'Freelancer object',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: { type: 'object' },
        },
      },
    }),
    ApiParam({
      name: 'userId',
      description: 'Freelancer user ID (UUID)',
      example: 'f1b6c8b2-3d4e-4f56-9abc-1234567890de',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),
  getFreelancers: applyDecorators(
    ApiOperation({ summary: 'Get all freelancers' }),
    ApiOkResponse({
      description: 'A list of all the freelancers',
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
};

export const FreelancerOrdersControllerSwagger = {
  controller: applyDecorators(ApiTags('Freelancer Orders'), ApiBearerAuth()),
  fetchOrders: applyDecorators(
    ApiOperation({ summary: 'List orders for the authenticated freelancer' }),
    ApiOkResponse({
      description: 'Orders grouped by status',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: { type: 'object' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
  ),
};

export const ClientFreelancerControllerSwagger = {
  controller: applyDecorators(ApiTags('Client Freelancers'), ApiBearerAuth()),
  getFreelancers: applyDecorators(
    ApiOperation({ summary: 'Retrieve all freelancers with their gigs' }),
    ApiOkResponse({
      description: 'List of freelancers',
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
};
