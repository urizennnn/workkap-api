import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
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
    ApiOkResponse({
      description: 'Messages retrieved.',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              messages: { type: 'array', items: { type: 'object' } },
              unreadCount: { type: 'number', example: 3 },
              conversationId: {
                type: 'string',
                example: 'e6f5d2d4-9b1a-4f4a-8a1f-2f3d4b5c6a7e',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid request or pagination params.',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized.' }),
  ),

  getConversations: applyDecorators(
    ApiOperation({
      summary: 'List conversations for the current user',
      description:
        'Returns all conversations the authenticated user participates in, including the other participant, last message, per-conversation unread counts, and a total unread count.',
    }),
    ApiOkResponse({
      description: 'Conversations retrieved.',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              conversations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    topic: { type: 'string', nullable: true },
                    participants: {
                      type: 'object',
                      properties: {
                        selfId: { type: 'string' },
                        otherId: { type: 'string' },
                      },
                    },
                    otherUser: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string', nullable: true },
                        fullName: { type: 'string', nullable: true },
                        username: { type: 'string', nullable: true },
                      },
                    },
                    lastMessage: { type: 'object', nullable: true },
                    unreadCount: { type: 'number' },
                    lastActivityAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              totalUnreadCount: { type: 'number' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized.' }),
  ),
} as const;
