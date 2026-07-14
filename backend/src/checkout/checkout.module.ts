import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { GetTransactionDeliveriesUseCase } from './application/get-transaction-deliveries.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { ListProductsUseCase } from './application/list-products.use-case';
import { PayTransactionUseCase } from './application/pay-transaction.use-case';
import { DELIVERY_REPOSITORY } from './domain/ports/delivery.repository';
import { PAYMENT_GATEWAY } from './domain/ports/payment.gateway';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository';
import { TRANSACTION_REPOSITORY } from './domain/ports/transaction.repository';
import { MysqlDeliveryRepository } from './infrastructure/mysql/mysql-delivery.repository';
import { MysqlProductRepository } from './infrastructure/mysql/mysql-product.repository';
import { MysqlTransactionRepository } from './infrastructure/mysql/mysql-transaction.repository';
import { MysqlProvider } from './infrastructure/mysql/mysql.provider';
import { SandboxPaymentGateway } from './infrastructure/payments/sandbox-payment.gateway';
import { ExternalCardPaymentGateway } from './infrastructure/payments/external-card-payment.gateway';
import { CheckoutController } from './presentation/http/checkout.controller';

@Module({
  controllers: [CheckoutController],
  providers: [
    MysqlProvider,
    ListProductsUseCase,
    CreateTransactionUseCase,
    GetTransactionUseCase,
    GetTransactionDeliveriesUseCase,
    PayTransactionUseCase,
    SandboxPaymentGateway,
    ExternalCardPaymentGateway,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: MysqlProductRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: MysqlTransactionRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useClass: MysqlDeliveryRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, SandboxPaymentGateway, ExternalCardPaymentGateway],
      useFactory: (
        config: ConfigService,
        sandboxGateway: SandboxPaymentGateway,
        externalGateway: ExternalCardPaymentGateway,
      ) => {
        return config.get<string>('PAYMENTS_MODE') === 'external'
          ? externalGateway
          : sandboxGateway;
      },
    },
  ],
})
export class CheckoutModule {}
