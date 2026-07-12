import { PaymentData } from '../payment-data';
import { Transaction, TransactionStatus } from '../transaction.entity';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type PaymentResult = {
  approved: boolean;
  status?: TransactionStatus;
  providerReference: string;
  failureReason?: string;
  statusChangedAt?: Date;
};

export interface PaymentGateway {
  pay(transaction: Transaction, paymentData: PaymentData): Promise<PaymentResult>;
}
