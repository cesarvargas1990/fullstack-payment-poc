import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentData } from '../domain/payment-data';
import { DELIVERY_REPOSITORY, DeliveryRepository } from '../domain/ports/delivery.repository';
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
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
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
      apiTransactionId: payment.apiTransactionId,
      providerReference: payment.providerReference,
      failureReason: payment.failureReason,
      statusChangedAt: payment.statusChangedAt ?? new Date(),
      updatedAt: payment.statusChangedAt ?? new Date(),
    };

    const updatedTransaction = await this.transactions.update(nextTransaction);

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

      await this.deliveries.assignProducts({
        transactionId: transaction.id,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    return updatedTransaction;
  }
}
