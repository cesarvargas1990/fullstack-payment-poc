import { Transaction } from '../transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionRepository {
  create(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  update(transaction: Transaction): Promise<Transaction>;
}
