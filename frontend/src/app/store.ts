import {configureStore, createListenerMiddleware} from '@reduxjs/toolkit';
import {
  clearPaymentTransaction,
  paymentTransactionReducer,
  setPaymentTransaction,
} from '../features/products/application/paymentTransactionSlice';
import {productsReducer} from '../features/products/application/productsSlice';
import {
  clearTransactionSecurely,
  saveTransactionSecurely,
} from '../features/products/infrastructure/secureTransactionStorage';

const securePersistence = createListenerMiddleware();

securePersistence.startListening({
  actionCreator: setPaymentTransaction,
  effect: async action => {
    await saveTransactionSecurely(action.payload);
  },
});

securePersistence.startListening({
  actionCreator: clearPaymentTransaction,
  effect: async () => {
    await clearTransactionSecurely();
  },
});

export const store = configureStore({
  reducer: {
    products: productsReducer,
    paymentTransaction: paymentTransactionReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().prepend(securePersistence.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
