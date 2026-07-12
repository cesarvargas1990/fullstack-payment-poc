import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PRODUCT_REPOSITORY, ProductRepository } from '../domain/ports/product.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction.entity';

export type CreateTransactionCommand = {
  productId?: string;
  quantity?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  customerEmail: string;
};

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    const requestedItems =
      command.items && command.items.length > 0
        ? command.items
        : command.productId && command.quantity
          ? [{productId: command.productId, quantity: command.quantity}]
          : [];

    if (requestedItems.length === 0) {
      throw new BadRequestException('At least one product is required');
    }

    const transactionItems: Transaction['items'] = [];
    let amountInCents = 0;
    let currency: 'COP' = 'COP';

    for (const item of requestedItems) {
      const product = await this.products.findById(item.productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (item.quantity > product.stock) {
        throw new BadRequestException('Insufficient stock');
      }

      currency = product.currency;
      const itemAmount = product.priceInCents * item.quantity;
      amountInCents += itemAmount;
      transactionItems.push({
        productId: product.id,
        quantity: item.quantity,
        amountInCents: itemAmount,
      });
    }

    const now = new Date();
    const transaction: Transaction = {
      id: randomUUID(),
      productId: transactionItems[0].productId,
      quantity: transactionItems.reduce((total, item) => total + item.quantity, 0),
      items: transactionItems,
      amountInCents,
      currency,
      status: 'PENDING',
      customerEmail: command.customerEmail,
      createdAt: now,
      updatedAt: now,
    };

    return this.transactions.create(transaction);
  }
}
