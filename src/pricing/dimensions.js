import { decimal } from './decimal.js';
import { fail } from './issues.js';

export function resolveDimension(dimensions) {
  if (!dimensions.length) fail('PRICE_DIMENSION_NOT_FOUND', 'No matching price dimension.');
  const limitations = [];
  const billable = dimensions.filter(dimension => {
    const price = decimal(dimension.pricePerUnit?.USD);
    if (price.isNegative()) fail('INVALID_PRICE', 'Negative price.');
    // Only normalization with explicit evidence may mark an allowance.
    if (dimension.freeAllowance === true) {
      if (!price.isZero() || !dimension.allowanceEvidence) fail('INVALID_FREE_ALLOWANCE', 'Allowance lacks evidence or has nonzero price.');
      limitations.push('free-tier');
      return false;
    }
    return true;
  });
  if (!billable.length) fail('PRICE_DIMENSION_NOT_FOUND', 'No normal billable dimension.');
  if (billable.length === 1) return { dimension: billable[0], limitations: [...new Set(limitations)] };
  const sorted = [...billable].sort((a, b) => decimal(a.beginRange).cmp(b.beginRange));
  const unit = sorted[0].unit;
  const contiguous = sorted.every((d, i) => d.unit === unit && !decimal(d.pricePerUnit.USD).isZero() && (d.endRange === 'Inf' || decimal(d.endRange).gt(d.beginRange)) && (i === 0 || sorted[i - 1].endRange !== 'Inf' && decimal(sorted[i - 1].endRange).eq(d.beginRange)));
  if (!contiguous || sorted.at(-1).endRange !== 'Inf') fail('AMBIGUOUS_PRICE_DIMENSION', 'Multiple heterogeneous or unproven tier dimensions.');
  return { dimension: sorted[0], limitations: [...new Set([...limitations, 'tier-pricing'])] };
}
