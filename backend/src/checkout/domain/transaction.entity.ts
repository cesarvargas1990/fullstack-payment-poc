export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export type Transaction = {
  id: string;
  productId: string;
  quantity: number;
  amountInCents: number;
  currency: 'COP';
  status: TransactionStatus;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
};
