import { Module } from '@nestjs/common';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { ListProductsUseCase } from './application/list-products.use-case';
import { PayTransactionUseCase } from './application/pay-transaction.use-case';
import { PAYMENT_GATEWAY } from './domain/ports/payment.gateway';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository';
import { TRANSACTION_REPOSITORY } from './domain/ports/transaction.repository';
import { MysqlProductRepository } from './infrastructure/mysql/mysql-product.repository';
import { MysqlTransactionRepository } from './infrastructure/mysql/mysql-transaction.repository';
import { MysqlProvider } from './infrastructure/mysql/mysql.provider';
import { SandboxPaymentGateway } from './infrastructure/payments/sandbox-payment.gateway';
import { CheckoutController } from './presentation/http/checkout.controller';

@Module({
  controllers: [CheckoutController],
  providers: [
    MysqlProvider,
    ListProductsUseCase,
    CreateTransactionUseCase,
    GetTransactionUseCase,
    PayTransactionUseCase,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: MysqlProductRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: MysqlTransactionRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: SandboxPaymentGateway,
    },
  ],
})
export class CheckoutModule {}
