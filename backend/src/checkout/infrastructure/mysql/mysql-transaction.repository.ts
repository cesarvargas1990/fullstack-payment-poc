import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { Transaction, TransactionStatus } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/ports/transaction.repository';
import { MysqlProvider } from './mysql.provider';

type TransactionRow = RowDataPacket & {
  id: string;
  product_id: string;
  quantity: number;
  items_json?: string | Transaction['items'] | null;
  amount_in_cents: number;
  currency: 'COP';
  status: TransactionStatus;
  api_transaction_id?: string | null;
  provider_reference?: string | null;
  failure_reason?: string | null;
  status_changed_at?: Date | null;
  customer_email: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class MysqlTransactionRepository implements TransactionRepository {
  constructor(private readonly mysql: MysqlProvider) {}

  async create(transaction: Transaction): Promise<Transaction> {
    await this.mysql.getPool().query(
      `
        INSERT INTO transactions (
          id, product_id, quantity, items_json, amount_in_cents, currency, status,
          customer_email, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transaction.id,
        transaction.productId,
        transaction.quantity,
        transaction.items ? JSON.stringify(transaction.items) : null,
        transaction.amountInCents,
        transaction.currency,
        transaction.status,
        transaction.customerEmail,
        transaction.createdAt,
        transaction.updatedAt,
      ],
    );

    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const [rows] = await this.mysql
      .getPool()
      .query<TransactionRow[]>('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    await this.mysql.getPool().query(
      `
        UPDATE transactions
        SET status = ?, api_transaction_id = ?, provider_reference = ?, failure_reason = ?, status_changed_at = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        transaction.status,
        transaction.apiTransactionId ?? null,
        transaction.providerReference ?? null,
        transaction.failureReason ?? null,
        transaction.statusChangedAt ?? null,
        transaction.updatedAt,
        transaction.id,
      ],
    );

    return transaction;
  }

  private toDomain(row: TransactionRow): Transaction {
    return {
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      items: this.parseItems(row.items_json),
      amountInCents: row.amount_in_cents,
      currency: row.currency,
      status: row.status,
      apiTransactionId: row.api_transaction_id ?? undefined,
      providerReference: row.provider_reference ?? undefined,
      failureReason: row.failure_reason ?? undefined,
      statusChangedAt: row.status_changed_at ?? undefined,
      customerEmail: row.customer_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private parseItems(itemsJson: TransactionRow['items_json']): Transaction['items'] {
    if (!itemsJson) {
      return undefined;
    }

    if (typeof itemsJson !== 'string') {
      return itemsJson;
    }

    return JSON.parse(itemsJson) as Transaction['items'];
  }
}
