import * as Keychain from 'react-native-keychain';
import {
  clearTransactionSecurely,
  loadTransactionSecurely,
  saveTransactionSecurely,
} from './secureTransactionStorage';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
  STORAGE_TYPE: {AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth'},
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

const transaction = {
  paidTotalInCents: 10000,
  result: {
    items: [],
    pendingTransaction: {id: 'tx-1'},
    paidTransaction: {id: 'tx-1', apiTransactionId: '15113-12345'},
  },
} as never;

describe('secureTransactionStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores transaction metadata with device-only encrypted storage', async () => {
    await saveTransactionSecurely(transaction);

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'payment-transaction',
      JSON.stringify(transaction),
      {
        service: 'com.checkoutapp.payment-transaction',
        accessible: 'WhenUnlockedThisDeviceOnly',
      },
    );
  });

  it('loads a stored transaction', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      service: 'com.checkoutapp.payment-transaction',
      username: 'payment-transaction',
      password: JSON.stringify(transaction),
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    await expect(loadTransactionSecurely()).resolves.toEqual(transaction);
  });

  it('returns null when no transaction exists', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);

    await expect(loadTransactionSecurely()).resolves.toBeNull();
  });

  it('clears malformed and explicitly removed data', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      service: 'com.checkoutapp.payment-transaction',
      username: 'payment-transaction',
      password: 'not-json',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    await expect(loadTransactionSecurely()).resolves.toBeNull();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.checkoutapp.payment-transaction',
    });

    await clearTransactionSecurely();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(2);
  });
});
