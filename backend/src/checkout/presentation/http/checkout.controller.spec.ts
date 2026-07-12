import { CheckoutController } from './checkout.controller';
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import { ListProductsUseCase } from '../../application/list-products.use-case';
import { PayTransactionUseCase } from '../../application/pay-transaction.use-case';

describe('CheckoutController', () => {
  const transaction = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 1,
    amountInCents: 10000,
    currency: 'COP' as const,
    status: 'PENDING' as const,
    customerEmail: 'buyer@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let listProducts: jest.Mocked<ListProductsUseCase>;
  let createTransaction: jest.Mocked<CreateTransactionUseCase>;
  let getTransaction: jest.Mocked<GetTransactionUseCase>;
  let payTransaction: jest.Mocked<PayTransactionUseCase>;
  let controller: CheckoutController;

  beforeEach(() => {
    listProducts = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ListProductsUseCase>;
    createTransaction = {
      execute: jest.fn().mockResolvedValue(transaction),
    } as unknown as jest.Mocked<CreateTransactionUseCase>;
    getTransaction = {
      execute: jest.fn().mockResolvedValue(transaction),
    } as unknown as jest.Mocked<GetTransactionUseCase>;
    payTransaction = {
      execute: jest.fn().mockResolvedValue({ ...transaction, status: 'APPROVED' }),
    } as unknown as jest.Mocked<PayTransactionUseCase>;

    controller = new CheckoutController(
      listProducts,
      createTransaction,
      getTransaction,
      payTransaction,
    );
  });

  it('lists products', async () => {
    await expect(controller.getProducts()).resolves.toEqual([]);
  });

  it('creates transactions', async () => {
    const body = {
      productId: 'prod-1',
      quantity: 1,
      customerEmail: 'buyer@example.com',
    };

    await expect(controller.create(body)).resolves.toEqual(transaction);
    expect(createTransaction.execute).toHaveBeenCalledWith(body);
  });

  it('gets transactions by id', async () => {
    await expect(controller.getById('tx-1')).resolves.toEqual(transaction);
    expect(getTransaction.execute).toHaveBeenCalledWith('tx-1');
  });

  it('pays transactions', async () => {
    const body = {
      cardNumber: '4242424242424242',
      expMonth: '12',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Test Buyer',
    };

    await expect(controller.pay('tx-1', body)).resolves.toEqual({
      ...transaction,
      status: 'APPROVED',
    });
    expect(payTransaction.execute).toHaveBeenCalledWith('tx-1', body);
  });
});
