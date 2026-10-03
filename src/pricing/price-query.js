import { matches } from './filter.js';
import { resolveDimension } from './dimensions.js';
import { fail } from './issues.js';

export function resolvePrice(products, query, context, fixedFilters = []) {
  if (query.expect !== 'singleSku') fail('INVALID_QUERY', 'Only singleSku is supported.');
  if (![...fixedFilters, ...query.productFilters].every(filter => /^(productFamily|operation|usageType|attributes\.[a-zA-Z][a-zA-Z0-9]*)$/.test(filter.field)) || !query.dimensionFilters.every(filter => ['unit', 'description', 'beginRange', 'endRange'].includes(filter.field))) fail('INVALID_QUERY', 'Unsupported product or dimension field.');
  const candidates = products.filter(product => matches(product, [...fixedFilters, ...query.productFilters], context));
  if (!candidates.length) fail('SKU_NOT_FOUND', 'Expected one SKU, matched none.');
  if (candidates.length !== 1) fail('AMBIGUOUS_SKU', `Expected one SKU, matched ${candidates.length}.`);
  const product = candidates[0];
  const terms = product.terms?.onDemand ?? [];
  if (terms.length !== 1) fail('AMBIGUOUS_ON_DEMAND_TERM', 'Exactly one current On-Demand term required.');
  const dimensions = terms[0].priceDimensions.filter(dimension => matches(dimension, query.dimensionFilters, context));
  return { product, skuCount: 1, ...resolveDimension(dimensions) };
}
