export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export type CardValidation = {
  brand: CardBrand;
  isNumberValid: boolean;
  isExpiryValid: boolean;
  isCvcValid: boolean;
  isValid: boolean;
  maskedNumber: string;
};

export function detectCardBrand(cardNumber: string): CardBrand {
  const normalized = normalizeCardNumber(cardNumber);

  if (/^4/.test(normalized)) {
    return 'visa';
  }

  const firstTwo = Number(normalized.slice(0, 2));
  const firstFour = Number(normalized.slice(0, 4));

  if (
    (firstTwo >= 51 && firstTwo <= 55) ||
    (firstFour >= 2221 && firstFour <= 2720)
  ) {
    return 'mastercard';
  }

  return 'unknown';
}

export function validateCardForm(input: {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}): CardValidation {
  const normalized = normalizeCardNumber(input.cardNumber);
  const brand = detectCardBrand(normalized);
  const expectedLength = brand === 'visa' ? 16 : brand === 'mastercard' ? 16 : 0;
  const isNumberValid =
    expectedLength > 0 &&
    normalized.length === expectedLength &&
    passesLuhn(normalized);
  const isExpiryValid = validateExpiry(input.expMonth, input.expYear);
  const isCvcValid = /^\d{3}$/.test(input.cvc.trim());

  return {
    brand,
    isNumberValid,
    isExpiryValid,
    isCvcValid,
    isValid: isNumberValid && isExpiryValid && isCvcValid,
    maskedNumber: maskCardNumber(normalized),
  };
}

export function normalizeCardNumber(cardNumber: string) {
  return cardNumber.replace(/\D/g, '');
}

export function formatCardNumber(cardNumber: string) {
  return normalizeCardNumber(cardNumber)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function validateExpiry(expMonth: string, expYear: string) {
  if (!/^\d{2}$/.test(expMonth) || !/^\d{2,4}$/.test(expYear)) {
    return false;
  }

  const month = Number(expMonth);

  if (month < 1 || month > 12) {
    return false;
  }

  const fullYear =
    expYear.length === 2 ? Number(`20${expYear}`) : Number(expYear);
  const now = new Date();
  const expiry = new Date(fullYear, month);
  const currentMonth = new Date(now.getFullYear(), now.getMonth());

  return expiry > currentMonth;
}

function passesLuhn(cardNumber: string) {
  let sum = 0;
  let doubleDigit = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index]);

    if (doubleDigit) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum > 0 && sum % 10 === 0;
}

function maskCardNumber(cardNumber: string) {
  if (cardNumber.length < 4) {
    return '****';
  }

  return `**** **** **** ${cardNumber.slice(-4)}`;
}
