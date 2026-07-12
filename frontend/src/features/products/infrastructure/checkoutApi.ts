import {API_BASE_URL} from '../../../shared/config/apiConfig';
import {normalizeCardNumber} from '../domain/cardValidation';
import {Product} from '../domain/Product';

export type CheckoutCartItem = {
  product: Product;
  quantity: number;
};

export type CheckoutPaymentData = {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
  customerEmail: string;
};

export type Transaction = {
  id: string;
  productId: string;
  quantity: number;
  items?: Array<{
    productId: string;
    quantity: number;
    amountInCents: number;
  }>;
  amountInCents: number;
  currency: 'COP';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  providerReference?: string;
  failureReason?: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt?: string;
};

export type CheckoutTransactionResult = {
  items: CheckoutCartItem[];
  pendingTransaction: Transaction;
  paidTransaction: Transaction;
};

export async function payCart(
  cartItems: CheckoutCartItem[],
  paymentData: CheckoutPaymentData,
) {
  const transaction = await createTransaction({
    items: cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
    customerEmail: paymentData.customerEmail,
  });
  console.log('[checkout-pending-transaction-created]', {
    transactionId: transaction.id,
    status: transaction.status,
    items: cartItems.length,
  });

  const paidTransaction = await payTransaction(transaction.id, paymentData);
  console.log('[checkout-paid-transaction-updated]', {
    transactionId: paidTransaction.id,
    status: paidTransaction.status,
    providerReference: paidTransaction.providerReference,
    statusChangedAt: paidTransaction.statusChangedAt,
  });

  return [
    {
      items: cartItems,
      pendingTransaction: transaction,
      paidTransaction,
    },
  ];
}

async function createTransaction(body: {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  customerEmail: string;
}) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'No fue posible crear la transaccion'));
  }

  return (await response.json()) as Transaction;
}

async function payTransaction(
  transactionId: string,
  paymentData: CheckoutPaymentData,
) {
  const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/pay`, {
    body: JSON.stringify({
      cardNumber: normalizeCardNumber(paymentData.cardNumber),
      expMonth: paymentData.expMonth,
      expYear: paymentData.expYear,
      cvc: paymentData.cvc,
      cardHolder: paymentData.cardHolder,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'El pago fue rechazado por el backend'));
  }

  return (await response.json()) as Transaction;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;

    return message ? `${fallback}: ${message}` : fallback;
  } catch {
    return `${fallback}. HTTP ${response.status}`;
  }
}
