import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

export const SocketDocs = {
  controller: applyDecorators(
    ApiTags('Sockets'),
  ),

  sendMessage: applyDecorators(
    ApiOperation({
      summary: "Emit 'send_message'",
      description:
        "Sends a chat message. The server emits 'new_message' to both users and updates 'unread_count' for the receiver.",
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          receiverId: { type: 'string' },
          name: { type: 'string' },
          content: { type: 'string' },
        },
      },
    }),
  ),

  readMessages: applyDecorators(
    ApiOperation({
      summary: "Emit 'read_messages'",
      description:
        "Marks messages in the specified conversation as read. Server responds with updated 'unread_count'.",
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }),
  ),
};
