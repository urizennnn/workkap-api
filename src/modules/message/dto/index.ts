import * as v from 'valibot';

export const SendMessageSchema = v.object({
  receiverId: v.string(),
  name: v.string(),
  content: v.string(),
});

export type SendMessageSchemaType = v.InferInput<typeof SendMessageSchema>;
