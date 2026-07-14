import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';

@Injectable()
export class MysqlProvider implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = mysql.createPool({
      host: this.config.get<string>('DB_HOST') ?? 'localhost',
      port: this.config.get<number>('DB_PORT') ?? 3306,
      user: this.config.get<string>('DB_USER') ?? 'checkout',
      password: this.config.get<string>('DB_PASSWORD') ?? 'checkout',
      database: this.config.get<string>('DB_NAME') ?? 'checkout',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async onModuleInit() {
    await this.migrate();
    await this.seed();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool() {
    return this.pool;
  }

  private async migrate() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        description VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NULL,
        price_in_cents INT NOT NULL,
        currency CHAR(3) NOT NULL,
        stock INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await this.ensureProductImageUrlColumn();

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        quantity INT NOT NULL,
        items_json JSON NULL,
        amount_in_cents INT NOT NULL,
        currency CHAR(3) NOT NULL,
        status VARCHAR(20) NOT NULL,
        api_transaction_id VARCHAR(120) NULL,
        provider_reference VARCHAR(120) NULL,
        failure_reason VARCHAR(255) NULL,
        status_changed_at TIMESTAMP NULL,
        customer_email VARCHAR(160) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        CONSTRAINT fk_transactions_product
          FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    await this.ensureTransactionProviderColumns();
  }

  private async ensureTransactionProviderColumns() {
    await this.ensureColumn('transactions', 'items_json', 'JSON NULL AFTER quantity');
    await this.ensureColumn('transactions', 'api_transaction_id', 'VARCHAR(120) NULL');
    await this.ensureColumn('transactions', 'provider_reference', 'VARCHAR(120) NULL');
    await this.ensureColumn('transactions', 'failure_reason', 'VARCHAR(255) NULL');
    await this.ensureColumn('transactions', 'status_changed_at', 'TIMESTAMP NULL');
  }

  private async seed() {
    await this.pool.query(
      `
        INSERT INTO products (id, name, description, image_url, price_in_cents, currency, stock)
        VALUES
          (?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          image_url = VALUES(image_url),
          price_in_cents = VALUES(price_in_cents),
          currency = VALUES(currency),
          stock = GREATEST(stock, VALUES(stock))
      `,
      [
        'prod-wireless-headphones',
        'Audifonos inalambricos',
        'Audifonos Bluetooth con cancelacion de ruido.',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&q=80',
        15990000,
        'COP',
        12,
        'prod-smart-watch',
        'Reloj inteligente',
        'Reloj deportivo resistente al agua.',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=640&q=80',
        21990000,
        'COP',
        8,
        'prod-portable-speaker',
        'Parlante portatil',
        'Parlante Bluetooth compacto con sonido envolvente.',
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=640&q=80',
        8990000,
        'COP',
        15,
        'prod-mechanical-keyboard',
        'Teclado mecanico',
        'Teclado compacto con switches tactiles e iluminacion.',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=640&q=80',
        12990000,
        'COP',
        10,
        'prod-gaming-mouse',
        'Mouse gamer',
        'Mouse ergonomico de alta precision para trabajo y juego.',
        'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=640&q=80',
        6990000,
        'COP',
        18,
        'prod-tablet-stand',
        'Soporte para tablet',
        'Soporte ajustable de aluminio para escritorio.',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80',
        4990000,
        'COP',
        20,
      ],
    );
  }

  private async ensureProductImageUrlColumn() {
    await this.ensureColumn('products', 'image_url', 'VARCHAR(500) NULL AFTER description');
  }

  private async ensureColumn(tableName: string, columnName: string, definition: string) {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [tableName, columnName],
    );

    if (rows.length === 0) {
      await this.pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
  }
}
