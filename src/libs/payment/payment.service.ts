import { Injectable } from '@nestjs/common';
import { PrismaService, PaystackService } from 'src/libs';
import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from 'src/libs/paystack/types';
import { PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
  ) {}

  private getCurrencyForCountry(country?: string): string {
    const map: Record<string, string> = {
      Nigeria: 'NGN',
      Ghana: 'GHS',
      Kenya: 'KES',
      'South Africa': 'ZAR',
      USA: 'USD',
      'United States': 'USD',
    };
    return country && map[country] ? map[country] : 'USD';
  }

  async initializePayment(
    userId: string,
    amount: number,
    orderId?: string,
  ): Promise<PaystackInitializeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) throw new Error('User not found');
    const currency = this.getCurrencyForCountry(user.country ?? undefined);
    const koboAmount = Math.round(amount * 100);
    const response = await this.paystack.initializeTransaction(
      user.email,
      koboAmount,
      currency,
    );
    const reference = response.data.reference;
    await this.prisma.payment.create({
      data: {
        userId,
        orderId: orderId ?? null,
        reference,
        amount: new Prisma.Decimal(amount),
        currency,
        status: PaymentStatus.INITIALIZED,
        histories: {
          create: {
            status: PaymentStatus.INITIALIZED,
            message: 'Transaction initialized',
          },
        },
      },
    });
    return response;
  }


  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) throw new Error('Payment not found');
    const response = await this.paystack.verifyTransaction(reference);
    const statusString = response.data.status;
    let status: PaymentStatus;
    switch (statusString.toLowerCase()) {
      case 'success':
        status = PaymentStatus.SUCCESS;
        break;
      case 'failed':
        status = PaymentStatus.FAILED;
        break;
      case 'pending':
        status = PaymentStatus.PENDING;
        break;
      default:
        status = PaymentStatus.PENDING;
        break;
    }
    await this.prisma.payment.update({
      where: { reference },
      data: {
        status,
        histories: {
          create: {
            status,
            message: response.data.gateway_response ?? response.message,
          },
        },
      },
    });
    return response;
  }
}

