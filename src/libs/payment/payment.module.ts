import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaystackModule } from '../paystack';

@Module({
  imports: [PaystackModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

