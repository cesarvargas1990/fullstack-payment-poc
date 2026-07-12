import {selectSelectedProduct} from './productsSelectors';
import {loadProducts, productsReducer, selectProduct} from './productsSlice';

const products = [
  {
    id: 'prod-1',
    name: 'Product 1',
    description: 'First product',
    imageUrl: 'https://example.com/product-1.jpg',
    priceInCents: 10000,
    currency: 'COP' as const,
    stock: 2,
  },
  {
    id: 'prod-2',
    name: 'Product 2',
    description: 'Second product',
    imageUrl: 'https://example.com/product-2.jpg',
    priceInCents: 20000,
    currency: 'COP' as const,
    stock: 1,
  },
];

describe('productsSlice', () => {
  it('moves to loading state when products are requested', () => {
    const state = productsReducer(undefined, loadProducts.pending('', undefined));

    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores products and selects the first one after loading succeeds', () => {
    const state = productsReducer(
      undefined,
      loadProducts.fulfilled(products, '', undefined),
    );

    expect(state.status).toBe('succeeded');
    expect(state.items).toEqual(products);
    expect(state.selectedProductId).toBe('prod-1');
  });

  it('stores errors when loading fails', () => {
    const state = productsReducer(
      undefined,
      loadProducts.rejected(new Error('Network error'), '', undefined),
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('selects a product by id', () => {
    const loadedState = productsReducer(
      undefined,
      loadProducts.fulfilled(products, '', undefined),
    );
    const selectedState = productsReducer(loadedState, selectProduct('prod-2'));

    expect(selectedState.selectedProductId).toBe('prod-2');
    expect(
      selectSelectedProduct({
        products: selectedState,
      }),
    ).toEqual(products[1]);
  });
});
