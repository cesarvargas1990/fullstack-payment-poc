import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PersistedCheckoutTransaction} from '../domain/CheckoutTransaction';
import {loadTransactionSecurely} from '../infrastructure/secureTransactionStorage';

type PaymentTransactionState = {
  current: PersistedCheckoutTransaction | null;
  hydrationStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
};

const initialState: PaymentTransactionState = {
  current: null,
  hydrationStatus: 'idle',
};

export const restorePaymentTransaction = createAsyncThunk(
  'paymentTransaction/restore',
  loadTransactionSecurely,
);

const paymentTransactionSlice = createSlice({
  name: 'paymentTransaction',
  initialState,
  reducers: {
    setPaymentTransaction(
      state,
      action: PayloadAction<PersistedCheckoutTransaction>,
    ) {
      state.current = action.payload;
    },
    clearPaymentTransaction(state) {
      state.current = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restorePaymentTransaction.pending, state => {
        state.hydrationStatus = 'loading';
      })
      .addCase(restorePaymentTransaction.fulfilled, (state, action) => {
        state.current = action.payload;
        state.hydrationStatus = 'succeeded';
      })
      .addCase(restorePaymentTransaction.rejected, state => {
        state.hydrationStatus = 'failed';
      });
  },
});

export const {clearPaymentTransaction, setPaymentTransaction} =
  paymentTransactionSlice.actions;
export const paymentTransactionReducer = paymentTransactionSlice.reducer;
