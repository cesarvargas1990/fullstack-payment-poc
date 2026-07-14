import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DELIVERY_REPOSITORY, DeliveryRepository } from '../domain/ports/delivery.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../domain/ports/transaction.repository';

@Injectable()
export class GetTransactionDeliveriesUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
  ) {}

  async execute(transactionId: string) {
    const transaction = await this.transactions.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.deliveries.findByTransactionId(transactionId);
  }
}
