import { Transaction } from '../../domain/transaction.entity';
import { SandboxPaymentGateway } from './sandbox-payment.gateway';

describe('SandboxPaymentGateway', () => {
  const transaction: Transaction = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 1,
    amountInCents: 10000,
    currency: 'COP',
    status: 'PENDING',
    customerEmail: 'buyer@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('approves complete card data by default', async () => {
    const gateway = new SandboxPaymentGateway();

    const result = await gateway.pay(transaction, {
      cardNumber: '4242424242424242',
      expMonth: '12',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Test Buyer',
    });

    expect(result.approved).toBe(true);
    expect(result.apiTransactionId).toBeUndefined();
    expect(result.providerReference).toBe('sandbox-tx-1');
  });

  it('declines incomplete card data', async () => {
    const gateway = new SandboxPaymentGateway();

    const result = await gateway.pay(transaction, {
      cardNumber: '',
      expMonth: '12',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Test Buyer',
    });

    expect(result.approved).toBe(false);
    expect(result.apiTransactionId).toBeUndefined();
    expect(result.failureReason).toBe('Incomplete payment data');
  });

  it('declines the sandbox declined card number', async () => {
    const gateway = new SandboxPaymentGateway();

    const result = await gateway.pay(transaction, {
      cardNumber: '4000000000000002',
      expMonth: '12',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Test Buyer',
    });

    expect(result.approved).toBe(false);
    expect(result.apiTransactionId).toBeUndefined();
    expect(result.failureReason).toBe('Sandbox declined card');
  });
});
