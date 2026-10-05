import { matches } from './filter.js';
import { resolveDimension } from './dimensions.js';
import { fail } from './issues.js';

function billableDimensions(dimensions) {
  return dimensions.filter(dimension => dimension.freeAllowance !== true);
}

export function mappingsForComponent(pkg, componentId) {
  return Object.values(pkg.pricingMappings ?? {}).filter(mapping => mapping.componentId === componentId);
}

export function mappingForComponent(pkg, componentId) {
  const mappings = mappingsForComponent(pkg, componentId);
  if (mappings.length > 1) fail('AMBIGUOUS_PRICING_MAPPING', `Component ${componentId} has ${mappings.length} pricing mappings; explicit multi-mapping semantics are not implemented.`);
  return mappings[0] ?? null;
}

export function priceSourceForComponent(pkg, componentId) {
  const mapping = mappingForComponent(pkg, componentId);
  return mapping?.priceSource?.serviceCode
    ?? pkg.service?.priceSource?.componentOverrides?.[componentId]
    ?? pkg.service?.priceSource?.serviceCode;
}

export function resolvePricingMapping(products, mapping, context = {}) {
  const candidates = products.filter(product => matches(product, mapping.productMatchers ?? [], context));
  const expectedProducts = mapping.expect?.products ?? 1;
  if (candidates.length !== expectedProducts) {
    fail(
      'MAPPING_PRODUCT_CARDINALITY',
      `Pricing mapping ${mapping.id} expected ${expectedProducts} product(s), matched ${candidates.length}.`
    );
  }
  if (candidates.length !== 1) {
    fail('MAPPING_PRODUCT_CARDINALITY', `Pricing mapping ${mapping.id} must resolve to exactly one product for materialization.`);
  }

  const product = candidates[0];
  const terms = product.terms?.onDemand ?? [];
  if (terms.length !== 1) {
    fail('MAPPING_ON_DEMAND_TERM_CARDINALITY', `Pricing mapping ${mapping.id} requires exactly one current On-Demand term, found ${terms.length}.`);
  }

  const matchedDimensions = terms[0].priceDimensions.filter(dimension => matches(dimension, mapping.dimensionMatchers ?? [], context));
  const billable = billableDimensions(matchedDimensions);
  const expectedDimensions = mapping.expect?.billableDimensions ?? 1;
  if (billable.length !== expectedDimensions) {
    fail(
      'MAPPING_DIMENSION_CARDINALITY',
      `Pricing mapping ${mapping.id} expected ${expectedDimensions} billable dimension(s), matched ${billable.length}.`
    );
  }

  return {
    mappingId: mapping.id,
    product,
    skuCount: candidates.length,
    matchedDimensionCount: matchedDimensions.length,
    billableDimensionCount: billable.length,
    ...resolveDimension(matchedDimensions)
  };
}
