import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

export const MessageSwaggerController = {
  controller: applyDecorators(ApiTags('Messages'), ApiBearerAuth()),

  getMessages: applyDecorators(
    ApiOperation({
      summary: 'Get messages with a user',
      description:
        'Fetch paginated messages between the authenticated user and the specified user. Messages are marked as read by default unless `markRead=false`.',
    }),
    ApiParam({
      name: 'otherUserId',
      required: true,
      description: 'The other participant user ID',
      example: 'b6b5a9b0-2a9d-4f7a-8b2a-5a917f6a7b1e',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      example: 1,
      description: '1-based page index.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 200,
      example: 50,
      description: 'Results per page (max 200).',
    }),
    ApiQuery({
      name: 'markRead',
      required: false,
      type: Boolean,
      example: true,
      description:
        'Whether to mark returned messages as read. Defaults to true.',
    }),
    ApiOkResponse({ description: 'Messages retrieved.' }),
    ApiBadRequestResponse({
      description: 'Invalid request or pagination params.',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized.' }),
  ),
};
