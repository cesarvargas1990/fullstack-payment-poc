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
        price_in_cents INT NOT NULL,
        currency CHAR(3) NOT NULL,
        stock INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        quantity INT NOT NULL,
        amount_in_cents INT NOT NULL,
        currency CHAR(3) NOT NULL,
        status VARCHAR(20) NOT NULL,
        customer_email VARCHAR(160) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        CONSTRAINT fk_transactions_product
          FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }

  private async seed() {
    await this.pool.query(
      `
        INSERT INTO products (id, name, description, price_in_cents, currency, stock)
        VALUES
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          price_in_cents = VALUES(price_in_cents),
          currency = VALUES(currency),
          stock = GREATEST(stock, VALUES(stock))
      `,
      [
        'prod-wireless-headphones',
        'Audifonos inalambricos',
        'Audifonos Bluetooth con cancelacion de ruido.',
        15990000,
        'COP',
        12,
        'prod-smart-watch',
        'Reloj inteligente',
        'Reloj deportivo resistente al agua.',
        21990000,
        'COP',
        8,
      ],
    );
  }
}
