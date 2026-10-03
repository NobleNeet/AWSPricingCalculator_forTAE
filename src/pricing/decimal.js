import DecimalLibrary from '../../vendor/decimal.mjs';

export const Decimal = DecimalLibrary.clone({ precision: 80, rounding: DecimalLibrary.ROUND_HALF_UP });
export function decimal(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && !Decimal.isDecimal(value)) throw new TypeError('Decimal value required');
  const result = new Decimal(value);
  if (!result.isFinite()) throw new TypeError('Finite decimal required');
  return result;
}
export const sum = values => values.reduce((total, value) => total.plus(decimal(value)), decimal('0'));
export function money(value) {
  const amount = decimal(value);
  if (amount.isZero()) return '$0.00';
  if (amount.abs().lt('0.01')) return amount.isNegative() ? '> -$0.01' : '< $0.01';
  return `${amount.isNegative() ? '-' : ''}$${amount.abs().toFixed(2)}`;
}
