export type TransactionDeliveryStatus = 'ASSIGNED';

export type TransactionDelivery = {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  status: TransactionDeliveryStatus;
  assignedAt: Date;
};
