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
    ApiCreatedResponse({ description: 'Gig created or updated' }),
    ApiBody({ description: 'Gig details' }),
  ),

  getGigs: applyDecorators(
    ApiOperation({ summary: 'Fetch gigs for the current user' }),
    ApiOkResponse({ description: 'List of gigs' }),
  ),

  getGig: applyDecorators(
    ApiOperation({ summary: 'Get a single gig by slug or ID' }),
    ApiOkResponse({ description: 'Gig data' }),
    ApiParam({ name: 'identifier', description: 'Gig slug or ID' }),
  ),

  deleteGig: applyDecorators(
    ApiOperation({ summary: 'Delete a gig' }),
    ApiOkResponse({ description: 'Gig deleted' }),
    ApiParam({ name: 'identifier', description: 'Gig slug or ID' }),
  ),
};
