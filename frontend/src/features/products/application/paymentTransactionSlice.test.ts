import {configureStore} from '@reduxjs/toolkit';
import {
  clearPaymentTransaction,
  paymentTransactionReducer,
  restorePaymentTransaction,
  setPaymentTransaction,
} from './paymentTransactionSlice';
import {loadTransactionSecurely} from '../infrastructure/secureTransactionStorage';
import {PersistedCheckoutTransaction} from '../domain/CheckoutTransaction';

jest.mock('../infrastructure/secureTransactionStorage', () => ({
  loadTransactionSecurely: jest.fn(),
}));

const persistedTransaction: PersistedCheckoutTransaction = {
  paidTotalInCents: 10000,
  result: {
    items: [],
    pendingTransaction: {
      id: 'tx-1',
      productId: 'prod-1',
      quantity: 1,
      amountInCents: 10000,
      currency: 'COP',
      status: 'PENDING',
      customerEmail: 'buyer@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    paidTransaction: {
      id: 'tx-1',
      productId: 'prod-1',
      quantity: 1,
      amountInCents: 10000,
      currency: 'COP',
      status: 'APPROVED',
      apiTransactionId: '15113-12345',
      customerEmail: 'buyer@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    },
  },
};

describe('paymentTransactionSlice', () => {
  it('stores and clears the current transaction in Redux', () => {
    const stored = paymentTransactionReducer(
      undefined,
      setPaymentTransaction(persistedTransaction),
    );
    expect(stored.current).toEqual(persistedTransaction);

    const cleared = paymentTransactionReducer(stored, clearPaymentTransaction());
    expect(cleared.current).toBeNull();
  });

  it('restores the encrypted transaction', async () => {
    jest.mocked(loadTransactionSecurely).mockResolvedValue(persistedTransaction);
    const store = configureStore({reducer: paymentTransactionReducer});

    await store.dispatch(restorePaymentTransaction());

    expect(store.getState()).toEqual({
      current: persistedTransaction,
      hydrationStatus: 'succeeded',
    });
  });

  it('marks hydration as failed when secure storage cannot be read', async () => {
    jest.mocked(loadTransactionSecurely).mockRejectedValue(new Error('Keychain unavailable'));
    const store = configureStore({reducer: paymentTransactionReducer});

    await store.dispatch(restorePaymentTransaction());

    expect(store.getState().hydrationStatus).toBe('failed');
  });
});
