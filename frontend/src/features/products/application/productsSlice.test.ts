import {
  selectCartItemCount,
  selectCartItems,
  selectCartTotalInCents,
} from './productsSelectors';
import {
  addProductToCart,
  clearCart,
  decreaseProductQuantity,
  loadProducts,
  productsReducer,
  removeProductFromCart,
} from './productsSlice';

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

const loadedState = () =>
  productsReducer(undefined, loadProducts.fulfilled(products, '', undefined));

describe('productsSlice', () => {
  it('moves to loading state when products are requested', () => {
    const state = productsReducer(undefined, loadProducts.pending('', undefined));

    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores products after loading succeeds', () => {
    const state = loadedState();

    expect(state.status).toBe('succeeded');
    expect(state.items).toEqual(products);
    expect(state.cartItems).toEqual({});
  });

  it('stores errors when loading fails', () => {
    const state = productsReducer(
      undefined,
      loadProducts.rejected(new Error('Network error'), '', undefined),
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('stores Redux default rejection message when loading fails without an error', () => {
    const state = productsReducer(
      undefined,
      loadProducts.rejected(null, '', undefined),
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Rejected');
  });

  it('adds product quantities to the cart', () => {
    const state = productsReducer(
      productsReducer(loadedState(), addProductToCart('prod-1')),
      addProductToCart('prod-1'),
    );

    expect(state.cartItems).toEqual({'prod-1': 2});
    expect(
      selectCartItems({
        products: state,
        paymentTransaction: {current: null, hydrationStatus: 'idle'},
      }),
    ).toEqual([{product: products[0], quantity: 2}]);
  });

  it('does not add more items than available stock', () => {
    const state = [addProductToCart('prod-1'), addProductToCart('prod-1'), addProductToCart('prod-1')]
      .reduce(productsReducer, loadedState());

    expect(state.cartItems).toEqual({'prod-1': 2});
  });

  it('ignores unknown products when adding to the cart', () => {
    const state = productsReducer(loadedState(), addProductToCart('missing'));

    expect(state.cartItems).toEqual({});
  });

  it('keeps stock-limited product quantity when stock is zero', () => {
    const zeroStockState = productsReducer(
      undefined,
      loadProducts.fulfilled([{...products[0], stock: 0}], '', undefined),
    );
    const state = productsReducer(zeroStockState, addProductToCart('prod-1'));

    expect(state.cartItems).toEqual({});
  });

  it('decreases and removes product quantities', () => {
    const withTwoItems = [addProductToCart('prod-1'), addProductToCart('prod-1')]
      .reduce(productsReducer, loadedState());
    const withOneItem = productsReducer(
      withTwoItems,
      decreaseProductQuantity('prod-1'),
    );
    const emptyCart = productsReducer(
      withOneItem,
      decreaseProductQuantity('prod-1'),
    );

    expect(withOneItem.cartItems).toEqual({'prod-1': 1});
    expect(emptyCart.cartItems).toEqual({});
  });

  it('removes a product from the cart', () => {
    const withItems = productsReducer(loadedState(), addProductToCart('prod-1'));
    const state = productsReducer(withItems, removeProductFromCart('prod-1'));

    expect(state.cartItems).toEqual({});
  });

  it('clears the cart', () => {
    const withItems = productsReducer(loadedState(), addProductToCart('prod-1'));
    const state = productsReducer(withItems, clearCart());

    expect(state.cartItems).toEqual({});
  });

  it('calculates cart count and total', () => {
    const state = [
      addProductToCart('prod-1'),
      addProductToCart('prod-1'),
      addProductToCart('prod-2'),
    ].reduce(productsReducer, loadedState());
    const rootState = {
      products: state,
      paymentTransaction: {current: null, hydrationStatus: 'idle' as const},
    };

    expect(selectCartItemCount(rootState)).toBe(3);
    expect(selectCartTotalInCents(rootState)).toBe(40000);
  });
});
