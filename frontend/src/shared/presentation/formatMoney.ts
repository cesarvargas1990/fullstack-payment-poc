export function formatMoney(valueInCents: number, currency: 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(valueInCents / 100);
}
