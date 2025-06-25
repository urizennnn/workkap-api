import { PackageTier } from '@prisma/client';
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
  package: v.optional(
    v.array(
      v.object({
        tier: v.pipe(v.enum(PackageTier, 'Invalid package tier')),
        name: v.string(),
        description: v.string(),
        deliveryTime: v.string(),
        customAssetDesign: v.optional(v.boolean()),
        sourceFile: v.optional(v.boolean()),
        contentUpload: v.optional(v.boolean()),
        convertToHtmlCss: v.optional(v.boolean()),
        revisions: v.optional(v.number()),
        price: v.number(),
        totalPrice: v.optional(v.number()),
      }),
    ),
  ),
  extraServices: v.optional(
    v.object({
      deliveryTime: v.optional(v.string()),
      extraPrice: v.optional(v.number()),
    }),
  ),
  images: v.optional(
    v.array(
      v.object({
        url: v.string(),
        alt: v.optional(v.string()),
      }),
    ),
  ),
  video: v.optional(
    v.object({
      url: v.string(),
      thumbnail: v.optional(v.string()),
    }),
  ),
  documents: v.optional(
    v.array(
      v.object({
        url: v.string(),
        name: v.optional(v.string()),
      }),
    ),
  ),
  questions: v.optional(
    v.array(
      v.object({
        text: v.string(),
      }),
    ),
  ),
});

export type GigSchemaType = v.InferInput<typeof GigSchema>;
