import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {fetchProducts} from '../infrastructure/productsApi';
import {Product} from '../domain/Product';

type ProductsState = {
  items: Product[];
  cartItems: Record<string, number>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ProductsState = {
  items: [],
  cartItems: {},
  status: 'idle',
  error: null,
};

export const loadProducts = createAsyncThunk('products/loadProducts', fetchProducts);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProductToCart(state, action: PayloadAction<string>) {
      const product = state.items.find(item => item.id === action.payload);

      if (!product) {
        return;
      }

      const currentQuantity = state.cartItems[action.payload] ?? 0;

      if (currentQuantity < product.stock) {
        state.cartItems[action.payload] = currentQuantity + 1;
      }
    },
    decreaseProductQuantity(state, action: PayloadAction<string>) {
      const currentQuantity = state.cartItems[action.payload] ?? 0;

      if (currentQuantity <= 1) {
        delete state.cartItems[action.payload];
        return;
      }

      state.cartItems[action.payload] = currentQuantity - 1;
    },
    removeProductFromCart(state, action: PayloadAction<string>) {
      delete state.cartItems[action.payload];
    },
    clearCart(state) {
      state.cartItems = {};
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
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Error cargando productos';
      });
  },
});

export const {
  addProductToCart,
  clearCart,
  decreaseProductQuantity,
  removeProductFromCart,
} = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
