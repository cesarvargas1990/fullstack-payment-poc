import { Injectable } from '@nestjs/common';
import { PaymentData } from '../../domain/payment-data';
import { PaymentGateway, PaymentResult } from '../../domain/ports/payment.gateway';
import { Transaction } from '../../domain/transaction.entity';

@Injectable()
export class SandboxPaymentGateway implements PaymentGateway {
  async pay(transaction: Transaction, paymentData: PaymentData): Promise<PaymentResult> {
    const hasCompleteData = [
      paymentData.cardNumber,
      paymentData.expMonth,
      paymentData.expYear,
      paymentData.cvc,
      paymentData.cardHolder,
    ].every(value => value.trim().length > 0);

    if (!hasCompleteData) {
      return {
        approved: false,
        status: 'DECLINED',
        providerReference: `sandbox-${transaction.id}`,
        failureReason: 'Incomplete payment data',
        statusChangedAt: new Date(),
      };
    }

    const normalizedCard = paymentData.cardNumber.replace(/\s/g, '');
    const approved = normalizedCard !== '4000000000000002';

    return {
      approved,
      status: approved ? 'APPROVED' : 'DECLINED',
      providerReference: `sandbox-${transaction.id}`,
      failureReason: approved ? undefined : 'Sandbox declined card',
      statusChangedAt: new Date(),
    };
  }
}
