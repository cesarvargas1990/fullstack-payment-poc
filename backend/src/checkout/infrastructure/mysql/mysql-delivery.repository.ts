import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { DeliveryRepository } from '../../domain/ports/delivery.repository';
import {
  TransactionDelivery,
  TransactionDeliveryStatus,
} from '../../domain/transaction-delivery.entity';
import { MysqlProvider } from './mysql.provider';

type TransactionDeliveryRow = RowDataPacket & {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  status: TransactionDeliveryStatus;
  assigned_at: Date;
};

@Injectable()
export class MysqlDeliveryRepository implements DeliveryRepository {
  constructor(private readonly mysql: MysqlProvider) {}

  async assignProducts(input: {
    transactionId: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<TransactionDelivery[]> {
    const assignedAt = new Date();
    const deliveries = input.items.map(item => ({
      id: randomUUID(),
      transactionId: input.transactionId,
      productId: item.productId,
      quantity: item.quantity,
      status: 'ASSIGNED' as const,
      assignedAt,
    }));

    if (deliveries.length === 0) {
      return [];
    }

    await this.mysql.getPool().query(
      `
        INSERT INTO transaction_deliveries (
          id, transaction_id, product_id, quantity, status, assigned_at
        ) VALUES ?
      `,
      [
        deliveries.map(delivery => [
          delivery.id,
          delivery.transactionId,
          delivery.productId,
          delivery.quantity,
          delivery.status,
          delivery.assignedAt,
        ]),
      ],
    );

    return deliveries;
  }

  async findByTransactionId(transactionId: string): Promise<TransactionDelivery[]> {
    const [rows] = await this.mysql.getPool().query<TransactionDeliveryRow[]>(
      `
        SELECT *
        FROM transaction_deliveries
        WHERE transaction_id = ?
        ORDER BY assigned_at ASC, id ASC
      `,
      [transactionId],
    );

    return rows.map(row => ({
      id: row.id,
      transactionId: row.transaction_id,
      productId: row.product_id,
      quantity: row.quantity,
      status: row.status,
      assignedAt: row.assigned_at,
    }));
  }
}
