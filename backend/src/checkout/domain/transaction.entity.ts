export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

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
  status: TransactionStatus;
  apiTransactionId?: string;
  providerReference?: string;
  failureReason?: string;
  statusChangedAt?: Date;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
};
