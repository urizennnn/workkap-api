import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

export const GigsControllerSwagger = {
  controller: applyDecorators(ApiTags('Gigs')),

  createGig: applyDecorators(
    ApiOperation({ summary: 'Create or update a gig' }),
    ApiCreatedResponse({
      description: 'Gig created or updated',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object' },
        },
      },
    }),
    ApiBody({
      description: 'Gig details',
      required: true,
      schema: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          mainCategory: { type: 'string' },
          subCategory: { type: 'string' },
          tools: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          thirdPartyAgreement: { type: 'boolean' },
        },
        required: ['title', 'mainCategory', 'subCategory', 'description'],
      },
    }),
  ),

  getGigs: applyDecorators(
    ApiOperation({ summary: 'Fetch gigs for the current user' }),
    ApiOkResponse({
      description: 'List of gigs',
      schema: { type: 'array', items: { type: 'object' } },
    }),
  ),

  getGig: applyDecorators(
    ApiOperation({ summary: 'Get a single gig by slug or ID' }),
    ApiOkResponse({ description: 'Gig data', schema: { type: 'object' } }),
    ApiParam({ name: 'identifier', description: 'Gig slug or ID' }),
  ),

  deleteGig: applyDecorators(
    ApiOperation({ summary: 'Delete a gig' }),
    ApiOkResponse({ description: 'Gig deleted' }),
    ApiParam({ name: 'identifier', description: 'Gig slug or ID' }),
  ),
};
