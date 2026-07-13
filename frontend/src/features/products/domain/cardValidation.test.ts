import {
  detectCardBrand,
  formatCardNumber,
  validateCardForm,
} from './cardValidation';

describe('cardValidation', () => {
  it('detects Visa cards', () => {
    expect(detectCardBrand('4242 4242 4242 4242')).toBe('visa');
  });

  it('detects Mastercard cards', () => {
    expect(detectCardBrand('5555 5555 5555 4444')).toBe('mastercard');
    expect(detectCardBrand('2221 0000 0000 0009')).toBe('mastercard');
  });

  it('formats card numbers in groups of four', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('validates complete card data', () => {
    const result = validateCardForm({
      cardNumber: '4242 4242 4242 4242',
      expMonth: '12',
      expYear: '29',
      cvc: '123',
    });

    expect(result).toEqual(
      expect.objectContaining({
        brand: 'visa',
        isNumberValid: true,
        isExpiryValid: true,
        isCvcValid: true,
        isValid: true,
        maskedNumber: '**** **** **** 4242',
      }),
    );
  });

  it('rejects invalid card numbers and expired dates', () => {
    const result = validateCardForm({
      cardNumber: '4111 1111 1111 1112',
      expMonth: '01',
      expYear: '20',
      cvc: '12',
    });

    expect(result.isNumberValid).toBe(false);
    expect(result.isExpiryValid).toBe(false);
    expect(result.isCvcValid).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it('detects unknown cards and masks short numbers safely', () => {
    const result = validateCardForm({
      cardNumber: '123',
      expMonth: '12',
      expYear: '2029',
      cvc: '123',
    });

    expect(detectCardBrand('1234 5678')).toBe('unknown');
    expect(result.brand).toBe('unknown');
    expect(result.isNumberValid).toBe(false);
    expect(result.maskedNumber).toBe('****');
  });

  it('rejects malformed expiration values and invalid months', () => {
    expect(
      validateCardForm({
        cardNumber: '4242 4242 4242 4242',
        expMonth: '1',
        expYear: '29',
        cvc: '123',
      }).isExpiryValid,
    ).toBe(false);
    expect(
      validateCardForm({
        cardNumber: '4242 4242 4242 4242',
        expMonth: '13',
        expYear: '2029',
        cvc: '123',
      }).isExpiryValid,
    ).toBe(false);
  });

  it('formats only the first sixteen card digits', () => {
    expect(formatCardNumber('42424242424242429999')).toBe(
      '4242 4242 4242 4242',
    );
  });
});
