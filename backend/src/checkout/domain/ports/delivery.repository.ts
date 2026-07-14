import { TransactionDelivery } from '../transaction-delivery.entity';

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface DeliveryRepository {
  assignProducts(input: {
    transactionId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }): Promise<TransactionDelivery[]>;

  findByTransactionId(transactionId: string): Promise<TransactionDelivery[]>;
}
