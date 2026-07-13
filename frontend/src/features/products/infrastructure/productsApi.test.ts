import {fetchProducts} from './productsApi';

jest.mock('../../../shared/config/apiConfig', () => ({
  API_BASE_URL: 'http://test-api.local',
}));

describe('productsApi', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('fetches products from the backend', async () => {
    const products = [
      {
        id: 'prod-1',
        name: 'Product 1',
        description: 'First product',
        imageUrl: 'https://example.com/product.jpg',
        priceInCents: 10000,
        currency: 'COP',
        stock: 2,
      },
    ];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(products),
    });

    await expect(fetchProducts()).resolves.toEqual(products);
    expect(fetchMock).toHaveBeenCalledWith('http://test-api.local/products');
  });

  it('fails when backend rejects the request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    await expect(fetchProducts()).rejects.toThrow('No fue posible cargar los productos');
  });
});
