import { PaymentMethod } from '@prisma/client';
import * as v from 'valibot';

export const CreateOrderSchema = v.object({
  freelancerId: v.string(),
  gigId: v.string(),
  modeOfWorking: v.object({
    hourlyRate: v.object({
      amount: v.number(),
      maxAmount: v.number(),
    }),
    contract: v.object({
      startDate: v.date(),
      endDate: v.date(),
    }),
  }),
  payment: v.pipe(
    v.string(),
    v.enum(
      PaymentMethod,
      'Payment method must be one of the predefined values',
    ),
  ),
});

export type CreateOrderSchemaType = v.InferInput<typeof CreateOrderSchema>;
