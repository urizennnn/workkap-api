import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const SocketDocs = {
  controller: applyDecorators(ApiTags('Sockets'), ApiBearerAuth()),

  sendMessage: applyDecorators(
    ApiOperation({
      summary: "Emit 'send_message'",
      description:
        "Sends a chat message to an existing conversation. The server emits 'new_message' to both participants and updates 'unread_count' for the receiver.",
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
          content: { type: 'string', nullable: true },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                type: { type: 'string', enum: ['IMAGE', 'PDF'] },
              },
              required: ['url', 'type'],
            },
            nullable: true,
          },
        },
        required: ['conversationId'],
      },
    }),
    ApiOkResponse({
      description: 'Message created',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          conversationId: { type: 'string' },
          content: { type: 'string', nullable: true },
          senderId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ),

  readMessages: applyDecorators(
    ApiOperation({
      summary: "Emit 'read_messages'",
      description:
        "Marks messages in the specified conversation as read for the authenticated user. Server responds with updated 'unread_count'.",
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
        },
        required: ['conversationId'],
      },
    }),
    ApiOkResponse({
      description: 'Unread count after marking as read',
      schema: {
        type: 'object',
        properties: {
          unreadCount: { type: 'number', example: 0 },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ),
} as const;
