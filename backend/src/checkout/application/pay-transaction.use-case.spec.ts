import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentGateway } from '../domain/ports/payment.gateway';
import { ProductRepository } from '../domain/ports/product.repository';
import { TransactionRepository } from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction.entity';
import { PayTransactionUseCase } from './pay-transaction.use-case';

describe('PayTransactionUseCase', () => {
  const pendingTransaction: Transaction = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 1,
    amountInCents: 10000,
    currency: 'COP',
    status: 'PENDING',
    customerEmail: 'buyer@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const paymentData = {
    cardNumber: '4242424242424242',
    expMonth: '12',
    expYear: '29',
    cvc: '123',
    cardHolder: 'Test Buyer',
  };

  let transactions: jest.Mocked<TransactionRepository>;
  let products: jest.Mocked<ProductRepository>;
  let payments: jest.Mocked<PaymentGateway>;
  let useCase: PayTransactionUseCase;

  beforeEach(() => {
    transactions = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(transaction => Promise.resolve(transaction)),
    };
    products = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };
    payments = {
      pay: jest.fn(),
    };
    useCase = new PayTransactionUseCase(transactions, products, payments);
  });

  it('approves a pending transaction and decreases stock', async () => {
    transactions.findById.mockResolvedValue(pendingTransaction);
    payments.pay.mockResolvedValue({
      approved: true,
      providerReference: 'sandbox-tx-1',
    });

    const result = await useCase.execute(pendingTransaction.id, paymentData);

    expect(result.status).toBe('APPROVED');
    expect(products.decreaseStock).toHaveBeenCalledWith('prod-1', 1);
    expect(transactions.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-1', status: 'APPROVED' }),
    );
  });

  it('declines a transaction without decreasing stock', async () => {
    transactions.findById.mockResolvedValue(pendingTransaction);
    payments.pay.mockResolvedValue({
      approved: false,
      providerReference: 'sandbox-tx-1',
      failureReason: 'declined',
    });

    const result = await useCase.execute(pendingTransaction.id, paymentData);

    expect(result.status).toBe('DECLINED');
    expect(products.decreaseStock).not.toHaveBeenCalled();
  });

  it('keeps transaction pending when provider result is still pending', async () => {
    transactions.findById.mockResolvedValue(pendingTransaction);
    payments.pay.mockResolvedValue({
      approved: false,
      status: 'PENDING',
      providerReference: 'provider-tx-1',
    });

    const result = await useCase.execute(pendingTransaction.id, paymentData);

    expect(result.status).toBe('PENDING');
    expect(products.decreaseStock).not.toHaveBeenCalled();
  });

  it('fails when transaction does not exist', async () => {
    transactions.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', paymentData)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fails when transaction is not pending', async () => {
    transactions.findById.mockResolvedValue({
      ...pendingTransaction,
      status: 'APPROVED',
    });

    await expect(
      useCase.execute(pendingTransaction.id, paymentData),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
