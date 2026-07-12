import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { ProductRepository } from '../domain/ports/product.repository';
import { TransactionRepository } from '../domain/ports/transaction.repository';

describe('CreateTransactionUseCase', () => {
  const product = {
    id: 'prod-1',
    name: 'Product',
    description: 'Test product',
    imageUrl: 'https://example.com/product.jpg',
    priceInCents: 10000,
    currency: 'COP' as const,
    stock: 2,
  };

  let products: jest.Mocked<ProductRepository>;
  let transactions: jest.Mocked<TransactionRepository>;
  let useCase: CreateTransactionUseCase;

  beforeEach(() => {
    products = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };
    transactions = {
      create: jest.fn(transaction => Promise.resolve(transaction)),
      findById: jest.fn(),
      update: jest.fn(),
    };
    useCase = new CreateTransactionUseCase(products, transactions);
  });

  it('creates a pending transaction with the product total', async () => {
    products.findById.mockResolvedValue(product);

    const result = await useCase.execute({
      productId: product.id,
      quantity: 2,
      customerEmail: 'buyer@example.com',
    });

    expect(result.status).toBe('PENDING');
    expect(result.amountInCents).toBe(20000);
    expect(result.currency).toBe('COP');
    expect(transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: product.id,
        quantity: 2,
        customerEmail: 'buyer@example.com',
      }),
    );
  });

  it('fails when product does not exist', async () => {
    products.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        productId: 'missing',
        quantity: 1,
        customerEmail: 'buyer@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fails when stock is insufficient', async () => {
    products.findById.mockResolvedValue(product);

    await expect(
      useCase.execute({
        productId: product.id,
        quantity: 3,
        customerEmail: 'buyer@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
