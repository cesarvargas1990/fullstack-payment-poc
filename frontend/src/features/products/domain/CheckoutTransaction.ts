import {Product} from './Product';

export type CheckoutCartItem = {
  product: Product;
  quantity: number;
};

export type Transaction = {
  id: string;
  productId: string;
  quantity: number;
  items?: Array<{
    productId: string;
    quantity: number;
    amountInCents: number;
  }>;
  amountInCents: number;
  currency: 'COP';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  apiTransactionId?: string;
  providerReference?: string;
  failureReason?: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt?: string;
};

export type CheckoutTransactionResult = {
  items: CheckoutCartItem[];
  pendingTransaction: Transaction;
  paidTransaction: Transaction;
};

export type PersistedCheckoutTransaction = {
  result: CheckoutTransactionResult;
  paidTotalInCents: number;
};
