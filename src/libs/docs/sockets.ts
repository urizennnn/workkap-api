import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

export const SocketDocs = {
  controller: applyDecorators(ApiTags('Sockets')),

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
          content: { type: 'string' },
        },
        required: ['conversationId', 'content'],
      },
    }),
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
  ),
};
