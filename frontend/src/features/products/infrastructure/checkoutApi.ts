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

type Transaction = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
};

export async function payCart(
  cartItems: CheckoutCartItem[],
  paymentData: CheckoutPaymentData,
) {
  const results: Transaction[] = [];

  for (const item of cartItems) {
    const transaction = await createTransaction({
      productId: item.product.id,
      quantity: item.quantity,
      customerEmail: paymentData.customerEmail,
    });

    const paidTransaction = await payTransaction(transaction.id, paymentData);
    results.push(paidTransaction);
  }

  return results;
}

async function createTransaction(body: {
  productId: string;
  quantity: number;
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
    throw new Error('No fue posible crear la transaccion');
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
    throw new Error('El pago fue rechazado por el backend');
  }

  return (await response.json()) as Transaction;
}
