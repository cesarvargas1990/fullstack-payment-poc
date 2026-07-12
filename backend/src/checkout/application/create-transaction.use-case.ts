import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PRODUCT_REPOSITORY, ProductRepository } from '../domain/ports/product.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction.entity';

export type CreateTransactionCommand = {
  productId: string;
  quantity: number;
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
    const product = await this.products.findById(command.productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (command.quantity > product.stock) {
      throw new BadRequestException('Insufficient stock');
    }

    const now = new Date();
    const transaction: Transaction = {
      id: randomUUID(),
      productId: product.id,
      quantity: command.quantity,
      amountInCents: product.priceInCents * command.quantity,
      currency: product.currency,
      status: 'PENDING',
      customerEmail: command.customerEmail,
      createdAt: now,
      updatedAt: now,
    };

    return this.transactions.create(transaction);
  }
}
