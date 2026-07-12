import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '../../../app/store';

export const selectProducts = (state: RootState) => state.products.items;
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;
const selectCartQuantities = (state: RootState) => state.products.cartItems;
export const selectCartItems = createSelector(
  [selectProducts, selectCartQuantities],
  (products, cartItems) =>
    products
      .map(product => ({
        product,
        quantity: cartItems[product.id] ?? 0,
      }))
      .filter(item => item.quantity > 0),
);
export const selectCartItemCount = (state: RootState) =>
  Object.values(state.products.cartItems).reduce(
    (total, quantity) => total + quantity,
    0,
  );
export const selectCartTotalInCents = createSelector(
  [selectCartItems],
  cartItems => cartItems.reduce(
    (total, item) => total + item.product.priceInCents * item.quantity,
    0,
  ),
);
