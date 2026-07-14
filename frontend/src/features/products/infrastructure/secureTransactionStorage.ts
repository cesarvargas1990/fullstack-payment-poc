import * as Keychain from 'react-native-keychain';
import {PersistedCheckoutTransaction} from '../domain/CheckoutTransaction';

const TRANSACTION_SERVICE = 'com.checkoutapp.payment-transaction';
const STORAGE_USERNAME = 'payment-transaction';

export async function saveTransactionSecurely(
  transaction: PersistedCheckoutTransaction,
): Promise<void> {
  await Keychain.setGenericPassword(
    STORAGE_USERNAME,
    JSON.stringify(transaction),
    {
      service: TRANSACTION_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
}

export async function loadTransactionSecurely(): Promise<PersistedCheckoutTransaction | null> {
  const credentials = await Keychain.getGenericPassword({
    service: TRANSACTION_SERVICE,
  });

  if (!credentials) {
    return null;
  }

  try {
    return JSON.parse(credentials.password) as PersistedCheckoutTransaction;
  } catch {
    await clearTransactionSecurely();
    return null;
  }
}

export async function clearTransactionSecurely(): Promise<void> {
  await Keychain.resetGenericPassword({service: TRANSACTION_SERVICE});
}
