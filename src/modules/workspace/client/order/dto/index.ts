import { PaymentMethod } from '@prisma/client';
import * as v from 'valibot';

export const CreateOrderSchema = v.object({
  freelancerId: v.string(),
  gigId: v.string(),
  modeOfWorking: v.union([
    v.object({
      hourlyRate: v.object({
        amount: v.number(),
        maxAmount: v.number(),
      }),
      contract: v.optional(v.any()),
    }),
    v.object({
      contract: v.object({
        startDate: v.date(),
        endDate: v.date(),
      }),
      hourlyRate: v.optional(v.any()),
    }),
  ]),
  note: v.optional(v.string()),
  jobBrief: v.optional(v.string()),
  keyResponsibilities: v.optional(v.array(v.string())),
  total: v.optional(v.number()),
  payment: v.pipe(
    v.string(),
    v.enum(
      PaymentMethod,
      'Payment method must be one of the predefined values',
    ),
  ),
});

export type CreateOrderSchemaType = v.InferInput<typeof CreateOrderSchema>;
