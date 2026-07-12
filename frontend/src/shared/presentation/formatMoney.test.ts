import {formatMoney} from './formatMoney';

describe('formatMoney', () => {
  it('formats Colombian pesos without cents', () => {
    expect(formatMoney(15990000, 'COP')).toContain('159.900');
  });
});
