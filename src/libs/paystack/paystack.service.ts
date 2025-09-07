import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pickFrom } from 'src/libs/config';
import type {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from './types';

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secret: string;
  constructor(private readonly config: ConfigService) {
    this.secret = pickFrom(this.config, 'paystack.secret_key', 'app') as string;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    currency: string,
  ): Promise<PaystackInitializeResponse> {
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email,
        amount,
        currency,
        channels: ['card'],
      },
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    return response.data as PaystackInitializeResponse;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    return response.data as PaystackVerifyResponse;
  }
}

