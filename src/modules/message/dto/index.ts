import * as v from 'valibot';

export const AttachmentSchema = v.object({
  url: v.string(),
  type: v.string(),
});

export const SendMessageSchema = v.object({
  conversationId: v.string(),
  content: v.optional(v.string()),
  attachments: v.optional(v.array(AttachmentSchema)),
});

export const GetConversationParamsSchema = v.object({
  otherUserId: v.pipe(v.string(), v.minLength(1, 'otherUserId is required')),
});

export type SendMessageSchemaType = v.InferInput<typeof SendMessageSchema>;

export const MarkMessagesReadSchema = v.object({
  conversationId: v.pipe(
    v.string(),
    v.minLength(1, 'conversationId is required'),
  ),
});

export type MarkMessagesReadSchemaType = v.InferInput<
  typeof MarkMessagesReadSchema
>;

