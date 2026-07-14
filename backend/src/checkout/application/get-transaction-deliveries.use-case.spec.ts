import { NotFoundException } from '@nestjs/common';
import { DeliveryRepository } from '../domain/ports/delivery.repository';
import { TransactionRepository } from '../domain/ports/transaction.repository';
import { GetTransactionDeliveriesUseCase } from './get-transaction-deliveries.use-case';

describe('GetTransactionDeliveriesUseCase', () => {
  let transactions: jest.Mocked<TransactionRepository>;
  let deliveries: jest.Mocked<DeliveryRepository>;
  let useCase: GetTransactionDeliveriesUseCase;

  beforeEach(() => {
    transactions = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    deliveries = {
      assignProducts: jest.fn(),
      findByTransactionId: jest.fn(),
    };
    useCase = new GetTransactionDeliveriesUseCase(transactions, deliveries);
  });

  it('returns assigned products for an existing transaction', async () => {
    const assignedAt = new Date('2026-07-13T22:53:00.000Z');
    const delivery = {
      id: 'delivery-1',
      transactionId: 'tx-1',
      productId: 'prod-1',
      quantity: 2,
      status: 'ASSIGNED' as const,
      assignedAt,
    };

    transactions.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'prod-1',
      quantity: 2,
      amountInCents: 20000,
      currency: 'COP',
      status: 'APPROVED',
      customerEmail: 'buyer@example.com',
      createdAt: new Date('2026-07-13T22:52:00.000Z'),
      updatedAt: new Date('2026-07-13T22:53:00.000Z'),
    });
    deliveries.findByTransactionId.mockResolvedValue([delivery]);

    await expect(useCase.execute('tx-1')).resolves.toEqual([delivery]);
    expect(deliveries.findByTransactionId).toHaveBeenCalledWith('tx-1');
  });

  it('fails when the transaction does not exist', async () => {
    transactions.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(deliveries.findByTransactionId).not.toHaveBeenCalled();
  });
});
