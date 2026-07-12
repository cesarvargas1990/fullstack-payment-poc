import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentData } from '../domain/payment-data';
import { PAYMENT_GATEWAY, PaymentGateway } from '../domain/ports/payment.gateway';
import { PRODUCT_REPOSITORY, ProductRepository } from '../domain/ports/product.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction.entity';

@Injectable()
export class PayTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly payments: PaymentGateway,
  ) {}

  async execute(transactionId: string, paymentData: PaymentData): Promise<Transaction> {
    const transaction = await this.transactions.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Only pending transactions can be paid');
    }

    const payment = await this.payments.pay(transaction, paymentData);
    const status = payment.status ?? (payment.approved ? 'APPROVED' : 'DECLINED');
    const nextTransaction: Transaction = {
      ...transaction,
      status,
      providerReference: payment.providerReference,
      failureReason: payment.failureReason,
      statusChangedAt: payment.statusChangedAt ?? new Date(),
      updatedAt: payment.statusChangedAt ?? new Date(),
    };

    if (status === 'APPROVED') {
      const items = transaction.items ?? [
        {
          productId: transaction.productId,
          quantity: transaction.quantity,
        },
      ];

      for (const item of items) {
        await this.products.decreaseStock(item.productId, item.quantity);
      }
    }

    return this.transactions.update(nextTransaction);
  }
}
