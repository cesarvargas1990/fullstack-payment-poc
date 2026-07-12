import {RootState} from '../../../app/store';

export const selectProducts = (state: RootState) => state.products.items;
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectSelectedProduct = (state: RootState) =>
  state.products.items.find(
    product => product.id === state.products.selectedProductId,
  ) ?? null;
