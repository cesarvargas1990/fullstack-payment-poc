import { NotFoundException } from '@nestjs/common';
import { TransactionRepository } from '../domain/ports/transaction.repository';
import { GetTransactionUseCase } from './get-transaction.use-case';

describe('GetTransactionUseCase', () => {
  const transaction = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 1,
    amountInCents: 10000,
    currency: 'COP' as const,
    status: 'PENDING' as const,
    customerEmail: 'buyer@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let transactions: jest.Mocked<TransactionRepository>;
  let useCase: GetTransactionUseCase;

  beforeEach(() => {
    transactions = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    useCase = new GetTransactionUseCase(transactions);
  });

  it('returns an existing transaction', async () => {
    transactions.findById.mockResolvedValue(transaction);

    await expect(useCase.execute(transaction.id)).resolves.toEqual(transaction);
  });

  it('fails when transaction does not exist', async () => {
    transactions.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
