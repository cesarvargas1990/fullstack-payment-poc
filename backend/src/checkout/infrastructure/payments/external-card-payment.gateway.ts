import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PaymentData } from '../../domain/payment-data';
import { PaymentGateway, PaymentResult } from '../../domain/ports/payment.gateway';
import { Transaction, TransactionStatus } from '../../domain/transaction.entity';

type ExternalMerchantResponse = {
  data?: {
    presigned_acceptance?: {
      acceptance_token?: string;
    };
    presigned_personal_data_auth?: {
      acceptance_token?: string;
    };
  };
};

type ExternalCardTokenResponse = {
  data?: {
    id?: string;
  };
};

type ExternalTransactionResponse = {
  data?: {
    id?: string;
    reference?: string;
    status?: string;
    status_message?: string;
    finalized_at?: string;
    created_at?: string;
  };
};

type AcceptanceTokens = {
  acceptanceToken: string;
  personalDataAcceptanceToken: string;
};

@Injectable()
export class ExternalCardPaymentGateway implements PaymentGateway {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;
  private readonly pollAttempts: number;
  private readonly pollIntervalMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('PAYMENT_PROVIDER_BASE_URL') ?? '';
    this.publicKey = this.config.get<string>('PAYMENT_PROVIDER_PUBLIC_KEY') ?? '';
    this.privateKey = this.config.get<string>('PAYMENT_PROVIDER_PRIVATE_KEY') ?? '';
    this.integritySecret = this.config.get<string>('PAYMENT_PROVIDER_INTEGRITY_SECRET') ?? '';
    this.pollAttempts = Number(this.config.get<string>('PAYMENT_PROVIDER_POLL_ATTEMPTS') ?? 5);
    this.pollIntervalMs = Number(this.config.get<string>('PAYMENT_PROVIDER_POLL_INTERVAL_MS') ?? 1000);
  }

  async pay(transaction: Transaction, paymentData: PaymentData): Promise<PaymentResult> {
    this.assertConfigured();

    const cardToken = await this.tokenizeCard(paymentData);
    const acceptanceTokens = await this.getAcceptanceTokens();
    const reference = `checkout-${transaction.id}`;
    const signature = this.createIntegritySignature(reference, transaction);

    const createdTransaction = await this.createTransaction({
      transaction,
      paymentData,
      cardToken,
      acceptanceTokens,
      reference,
      signature,
    });

    const providerTransaction = await this.pollTransaction(createdTransaction);
    const status = this.mapProviderStatus(providerTransaction.status);

    return {
      approved: status === 'APPROVED',
      status,
      apiTransactionId: providerTransaction.id,
      providerReference: providerTransaction.reference,
      failureReason: status === 'APPROVED' ? undefined : providerTransaction.statusMessage,
      statusChangedAt: providerTransaction.statusChangedAt,
    };
  }

  private assertConfigured(): void {
    const missing = [
      ['PAYMENT_PROVIDER_PUBLIC_KEY', this.publicKey],
      ['PAYMENT_PROVIDER_PRIVATE_KEY', this.privateKey],
      ['PAYMENT_PROVIDER_INTEGRITY_SECRET', this.integritySecret],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new InternalServerErrorException(
        `Missing payment provider configuration: ${missing.join(', ')}`,
      );
    }
  }

  private async getAcceptanceTokens(): Promise<AcceptanceTokens> {
    const response = await this.request<ExternalMerchantResponse>(
      `/merchants/${this.publicKey}`,
      {
        method: 'GET',
      },
    );
    const acceptanceToken = response.data?.presigned_acceptance?.acceptance_token;
    const personalDataAcceptanceToken =
      response.data?.presigned_personal_data_auth?.acceptance_token;

    if (!acceptanceToken || !personalDataAcceptanceToken) {
      throw new InternalServerErrorException('Payment provider acceptance tokens were not returned');
    }

    return { acceptanceToken, personalDataAcceptanceToken };
  }

  private async tokenizeCard(paymentData: PaymentData): Promise<string> {
    const response = await this.request<ExternalCardTokenResponse>('/tokens/cards', {
      method: 'POST',
      headers: this.jsonHeaders(this.publicKey),
      body: JSON.stringify({
        number: paymentData.cardNumber.replace(/\s/g, ''),
        cvc: paymentData.cvc,
        exp_month: paymentData.expMonth,
        exp_year: paymentData.expYear,
        card_holder: paymentData.cardHolder,
      }),
    });
    const cardToken = response.data?.id;

    if (!cardToken) {
      throw new InternalServerErrorException('Payment provider card token was not returned');
    }

    return cardToken;
  }

  private async createTransaction(input: {
    transaction: Transaction;
    paymentData: PaymentData;
    cardToken: string;
    acceptanceTokens: AcceptanceTokens;
    reference: string;
    signature: string;
  }): Promise<{ id: string; reference: string }> {
    const response = await this.request<ExternalTransactionResponse>('/transactions', {
      method: 'POST',
      headers: this.jsonHeaders(this.privateKey),
      body: JSON.stringify({
        acceptance_token: input.acceptanceTokens.acceptanceToken,
        accept_personal_auth: input.acceptanceTokens.personalDataAcceptanceToken,
        amount_in_cents: input.transaction.amountInCents,
        currency: input.transaction.currency,
        customer_email: input.transaction.customerEmail,
        payment_method: {
          type: 'CARD',
          token: input.cardToken,
          installments: 1,
        },
        payment_method_type: 'CARD',
        reference: input.reference,
        signature: input.signature,
      }),
    });
    const id = response.data?.id;

    if (!id) {
      throw new InternalServerErrorException('Payment provider transaction id was not returned');
    }

    return { id, reference: response.data?.reference ?? input.reference };
  }

  private async pollTransaction(providerTransaction: {
    id: string;
    reference: string;
  }): Promise<{
    id: string;
    reference: string;
    status: string;
    statusMessage?: string;
    statusChangedAt?: Date;
  }> {
    let lastStatus = 'PENDING';
    let lastStatusMessage: string | undefined;
    let lastStatusChangedAt: Date | undefined;

    for (let attempt = 0; attempt < this.pollAttempts; attempt += 1) {
      const response = await this.request<ExternalTransactionResponse>(
        `/transactions/${providerTransaction.id}`,
        {
          method: 'GET',
          headers: this.jsonHeaders(this.publicKey),
        },
      );
      lastStatus = response.data?.status ?? 'ERROR';
      lastStatusMessage = response.data?.status_message;
      lastStatusChangedAt = this.parseProviderDate(
        response.data?.finalized_at ?? response.data?.created_at,
      );

      if (lastStatus !== 'PENDING') {
        break;
      }

      if (attempt < this.pollAttempts - 1) {
        await this.wait(this.pollIntervalMs);
      }
    }

    return {
      id: providerTransaction.id,
      reference: providerTransaction.reference,
      status: lastStatus,
      statusMessage: lastStatusMessage ?? lastStatus,
      statusChangedAt: lastStatusChangedAt,
    };
  }

  private parseProviderDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private createIntegritySignature(reference: string, transaction: Transaction): string {
    return createHash('sha256')
      .update(
        `${reference}${transaction.amountInCents}${transaction.currency}${this.integritySecret}`,
      )
      .digest('hex');
  }

  private mapProviderStatus(status: string): TransactionStatus {
    if (status === 'APPROVED') {
      return 'APPROVED';
    }

    if (status === 'DECLINED' || status === 'VOIDED') {
      return 'DECLINED';
    }

    if (status === 'PENDING') {
      return 'PENDING';
    }

    return 'ERROR';
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);

    if (!response.ok) {
      const body = await response.text();
      throw new InternalServerErrorException(
        `Payment provider request failed: ${response.status} ${this.formatErrorBody(body)}`,
      );
    }

    return (await response.json()) as T;
  }

  private jsonHeaders(bearerToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    };
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  private formatErrorBody(body: string): string {
    try {
      const parsed = JSON.parse(body) as {
        error?: {
          messages?: Record<string, string[]>;
          reason?: string;
        };
      };
      const messages = parsed.error?.messages;

      if (messages) {
        return Object.entries(messages)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');
      }

      return parsed.error?.reason ?? body;
    } catch {
      return body;
    }
  }
}
