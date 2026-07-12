import { PaymentData } from '../payment-data';
import { Transaction } from '../transaction.entity';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type PaymentResult = {
  approved: boolean;
  providerReference: string;
  failureReason?: string;
};

export interface PaymentGateway {
  pay(transaction: Transaction, paymentData: PaymentData): Promise<PaymentResult>;
}
