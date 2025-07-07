import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pickFrom } from 'libs/config';

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secret: string;
  constructor(private readonly config: ConfigService) {
    this.secret = pickFrom(this.config, 'paystack.secret_key', 'app');
  }

  async initializeTransaction(
    email: string,
    amount: number,
  ): Promise<Record<string, unknown>> {
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      { email, amount },
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    return response.data as Record<string, unknown>;
  }

  async verifyTransaction(reference: string): Promise<Record<string, unknown>> {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    return response.data as Record<string, unknown>;
  }
}
