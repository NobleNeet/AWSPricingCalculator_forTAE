import { decimal } from './decimal.js';
import { fail } from './issues.js';

// Integrate an explicitly supported paid meter. An excluded allowance never
// becomes an implicit discount: paid ranges start at the first paid boundary.
export function tierAmount(quantity, dimensions, offset = '0') {
  const sorted = [...dimensions].sort((a, b) => decimal(a.beginRange).cmp(b.beginRange));
  if (!sorted.length) fail('PRICE_DIMENSION_NOT_FOUND', 'No paid tier.');
  const origin = decimal(sorted[0].beginRange);
  const start = decimal(offset), end = start.plus(decimal(quantity));
  if (start.isNegative() || end.lt(start)) fail('INVALID_USAGE', 'Negative tier usage.');
  let amount = decimal('0');
  for (const [index, tier] of sorted.entries()) {
    if (tier.unit !== sorted[0].unit || index && (sorted[index - 1].endRange === 'Inf' || !decimal(sorted[index - 1].endRange).eq(tier.beginRange)) || tier.endRange === 'Inf' && index !== sorted.length - 1) fail('AMBIGUOUS_PRICE_DIMENSION', 'Invalid paid tier ranges.');
    const lower = decimal(tier.beginRange).minus(origin);
    const upper = tier.endRange === 'Inf' ? end : decimal(tier.endRange).minus(origin);
    const from = start.gt(lower) ? start : lower, to = end.lt(upper) ? end : upper;
    const price = decimal(tier.pricePerUnit.USD);
    if (price.isNegative() || tier.endRange !== 'Inf' && !upper.gt(lower)) fail('INVALID_PRICE', 'Invalid paid tier.');
    if (to.gt(from)) amount = amount.plus(to.minus(from).times(price));
  }
  if (sorted.at(-1).endRange !== 'Inf') fail('AMBIGUOUS_PRICE_DIMENSION', 'Paid tiers must cover all usage.');
  return amount;
}
