import * as v from 'valibot';

export const SendMessageSchema = v.object({
  receiverId: v.string(),
  name: v.string(),
  content: v.string(),
});

export const GetConversationParamsSchema = v.object({
  otherUserId: v.pipe(v.string(), v.minLength(1, 'otherUserId is required')),
});

export type SendMessageSchemaType = v.InferInput<typeof SendMessageSchema>;
