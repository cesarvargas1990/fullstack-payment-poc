import {RootState} from '../../../app/store';

export const selectProducts = (state: RootState) => state.products.items;
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectCartItems = (state: RootState) =>
  state.products.items
    .map(product => ({
      product,
      quantity: state.products.cartItems[product.id] ?? 0,
    }))
    .filter(item => item.quantity > 0);
export const selectCartItemCount = (state: RootState) =>
  Object.values(state.products.cartItems).reduce(
    (total, quantity) => total + quantity,
    0,
  );
export const selectCartTotalInCents = (state: RootState) =>
  selectCartItems(state).reduce(
    (total, item) => total + item.product.priceInCents * item.quantity,
    0,
  );
