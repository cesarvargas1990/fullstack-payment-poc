import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {fetchProducts} from '../infrastructure/productsApi';
import {Product} from '../domain/Product';

type ProductsState = {
  items: Product[];
  selectedProductId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ProductsState = {
  items: [],
  selectedProductId: null,
  status: 'idle',
  error: null,
};

export const loadProducts = createAsyncThunk('products/loadProducts', fetchProducts);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      state.selectedProductId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadProducts.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.selectedProductId = action.payload[0]?.id ?? null;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Error cargando productos';
      });
  },
});

export const {selectProduct} = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
