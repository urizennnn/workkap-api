import * as v from 'valibot';

export const GigSchema = v.object({
  slug: v.optional(v.string()),
  title: v.string(),
  mainCategory: v.string(),
  subCategory: v.string(),
  tools: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
  description: v.string(),
  thirdPartyAgreement: v.optional(v.boolean()),
});

export type GigSchemaType = v.InferInput<typeof GigSchema>;
