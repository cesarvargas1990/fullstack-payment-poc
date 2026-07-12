import { Injectable } from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/ports/product.repository';
import { MysqlProvider } from './mysql.provider';

type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_in_cents: number;
  currency: 'COP';
  stock: number;
};

@Injectable()
export class MysqlProductRepository implements ProductRepository {
  constructor(private readonly mysql: MysqlProvider) {}

  async findAll(): Promise<Product[]> {
    const [rows] = await this.mysql
      .getPool()
      .query<ProductRow[]>('SELECT * FROM products ORDER BY name ASC');

    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const [rows] = await this.mysql
      .getPool()
      .query<ProductRow[]>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async decreaseStock(productId: string, quantity: number): Promise<void> {
    const [result] = await this.mysql.getPool().query<ResultSetHeader>(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantity, productId, quantity],
    );

    if (result.affectedRows !== 1) {
      throw new Error('Unable to decrease product stock');
    }
  }

  private toDomain(row: ProductRow): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      priceInCents: row.price_in_cents,
      currency: row.currency,
      stock: row.stock,
    };
  }
}
