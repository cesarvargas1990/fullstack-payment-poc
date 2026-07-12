import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Transaction } from '../../domain/transaction.entity';
import { ExternalCardPaymentGateway } from './external-card-payment.gateway';

describe('ExternalCardPaymentGateway', () => {
  const transaction: Transaction = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 1,
    amountInCents: 15990000,
    currency: 'COP',
    status: 'PENDING',
    customerEmail: 'buyer@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const paymentData = {
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '29',
    cvc: '123',
    cardHolder: 'Test Buyer',
  };

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        PAYMENT_PROVIDER_BASE_URL: 'https://external.test/v1',
        PAYMENT_PROVIDER_PUBLIC_KEY: 'pub_test_key',
        PAYMENT_PROVIDER_PRIVATE_KEY: 'prv_test_key',
        PAYMENT_PROVIDER_INTEGRITY_SECRET: 'integrity_secret',
        PAYMENT_PROVIDER_POLL_ATTEMPTS: '1',
        PAYMENT_PROVIDER_POLL_INTERVAL_MS: '0',
      };

      return values[key];
    }),
  } as unknown as ConfigService;

  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('tokenizes card, creates provider transaction and returns approved result', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'tok_test_card' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            presigned_acceptance: { acceptance_token: 'acceptance-token' },
            presigned_personal_data_auth: { acceptance_token: 'personal-token' },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'external-tx-1' } }))
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: 'external-tx-1', status: 'APPROVED' } }),
      );

    const result = await new ExternalCardPaymentGateway(config).pay(transaction, paymentData);

    const expectedReference = 'checkout-tx-1';
    const expectedSignature = createHash('sha256')
      .update(`${expectedReference}${transaction.amountInCents}${transaction.currency}integrity_secret`)
      .digest('hex');

    expect(result).toEqual({
      approved: true,
      status: 'APPROVED',
      providerReference: 'checkout-tx-1',
      failureReason: undefined,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://external.test/v1/tokens/cards',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer pub_test_key' }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual(
      expect.objectContaining({
        acceptance_token: 'acceptance-token',
        accept_personal_auth: 'personal-token',
        amount_in_cents: 15990000,
        currency: 'COP',
        customer_email: 'buyer@example.com',
        reference: expectedReference,
        signature: expectedSignature,
        payment_method: {
          type: 'CARD',
          token: 'tok_test_card',
          installments: 1,
        },
        payment_method_type: 'CARD',
      }),
    );
  });

  it('returns declined result when provider declines the payment', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'tok_test_card' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            presigned_acceptance: { acceptance_token: 'acceptance-token' },
            presigned_personal_data_auth: { acceptance_token: 'personal-token' },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'external-tx-1' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            id: 'external-tx-1',
            status: 'DECLINED',
            status_message: 'Insufficient funds',
          },
        }),
      );

    const result = await new ExternalCardPaymentGateway(config).pay(transaction, paymentData);

    expect(result).toEqual({
      approved: false,
      status: 'DECLINED',
      providerReference: 'checkout-tx-1',
      failureReason: 'Insufficient funds',
    });
  });

  it('fails fast when required keys are missing', async () => {
    const incompleteConfig = {
      get: jest.fn(() => ''),
    } as unknown as ConfigService;

    await expect(
      new ExternalCardPaymentGateway(incompleteConfig).pay(transaction, paymentData),
    ).rejects.toThrow('Missing payment provider configuration');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}
