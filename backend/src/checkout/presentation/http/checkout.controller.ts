import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import { ListProductsUseCase } from '../../application/list-products.use-case';
import { PayTransactionUseCase } from '../../application/pay-transaction.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';

@Controller()
export class CheckoutController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getTransaction: GetTransactionUseCase,
    private readonly payTransaction: PayTransactionUseCase,
  ) {}

  @Get('products')
  getProducts() {
    return this.listProducts.execute();
  }

  @Post('transactions')
  create(@Body() body: CreateTransactionDto) {
    return this.createTransaction.execute(body);
  }

  @Get('transactions/:id')
  getById(@Param('id') id: string) {
    return this.getTransaction.execute(id);
  }

  @Post('transactions/:id/pay')
  pay(@Param('id') id: string, @Body() body: PayTransactionDto) {
    return this.payTransaction.execute(id, body);
  }
}
