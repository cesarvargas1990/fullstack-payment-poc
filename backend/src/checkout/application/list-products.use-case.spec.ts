import { ProductRepository } from '../domain/ports/product.repository';
import { ListProductsUseCase } from './list-products.use-case';

describe('ListProductsUseCase', () => {
  it('returns all products from the repository', async () => {
    const products: jest.Mocked<ProductRepository> = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'prod-1',
          name: 'Product',
          description: 'Test product',
          imageUrl: 'https://example.com/product.jpg',
          priceInCents: 10000,
          currency: 'COP',
          stock: 3,
        },
      ]),
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };

    const result = await new ListProductsUseCase(products).execute();

    expect(result).toHaveLength(1);
    expect(products.findAll).toHaveBeenCalledTimes(1);
  });
});
