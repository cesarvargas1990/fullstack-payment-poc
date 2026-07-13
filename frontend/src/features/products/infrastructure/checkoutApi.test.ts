import {CheckoutCartItem, payCart} from './checkoutApi';

jest.mock('../../../shared/config/apiConfig', () => ({
  API_BASE_URL: 'http://test-api.local',
}));

describe('checkoutApi', () => {
  const fetchMock = jest.fn();
  const cartItems: CheckoutCartItem[] = [
    {
      product: {
        id: 'prod-1',
        name: 'Product 1',
        description: 'First product',
        imageUrl: 'https://example.com/product.jpg',
        priceInCents: 10000,
        currency: 'COP',
        stock: 2,
      },
      quantity: 2,
    },
  ];
  const paymentData = {
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '29',
    cvc: '123',
    cardHolder: 'Test Buyer',
    customerEmail: 'buyer@example.com',
  };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('creates one cart transaction and then pays it', async () => {
    const pendingTransaction = {
      id: 'tx-1',
      productId: 'prod-1',
      quantity: 2,
      items: [{productId: 'prod-1', quantity: 2, amountInCents: 20000}],
      amountInCents: 20000,
      currency: 'COP',
      status: 'PENDING',
      customerEmail: 'buyer@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const paidTransaction = {
      ...pendingTransaction,
      status: 'APPROVED',
      providerReference: 'checkout-tx-1',
      statusChangedAt: '2026-01-01T00:00:01.000Z',
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(pendingTransaction))
      .mockResolvedValueOnce(jsonResponse(paidTransaction));

    await expect(payCart(cartItems, paymentData)).resolves.toEqual([
      {
        items: cartItems,
        pendingTransaction,
        paidTransaction,
      },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://test-api.local/transactions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          items: [{productId: 'prod-1', quantity: 2}],
          customerEmail: 'buyer@example.com',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://test-api.local/transactions/tx-1/pay',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          cardNumber: '4242424242424242',
          expMonth: '12',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Test Buyer',
        }),
      }),
    );
  });

  it('returns backend message when creating transaction fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({message: ['Invalid cart']}),
    });

    await expect(payCart(cartItems, paymentData)).rejects.toThrow(
      'No fue posible crear la transaccion: Invalid cart',
    );
  });

  it('returns backend message when payment fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({id: 'tx-1', status: 'PENDING'}))
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({message: 'Payment declined'}),
      });

    await expect(payCart(cartItems, paymentData)).rejects.toThrow(
      'El pago fue rechazado por el backend: Payment declined',
    );
  });
});

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  };
}
