import { matches } from '../../src/pricing/filter.js';
import { issue } from '../../src/pricing/issues.js';
import { encode } from './normalize.js';
import { decimal } from '../../src/pricing/decimal.js';

export function usageTypeClass(usageType, common, specific) {
  let value = usageType;
  for (const prefix of common.regionPrefixes) if (value.startsWith(prefix)) { value = value.slice(prefix.length); break; }
  const rule = [...common.rules, ...specific.rules].find(rule => value.startsWith(rule.prefix));
  return rule ? rule.class : value;
}
export function inventory(data, common, specific) {
  const categories = new Map();
  for (const product of data.products) for (const dimension of product.terms.onDemand[0].priceDimensions) {
    const category = { productFamily: product.productFamily, operation: product.operation, usageTypeClass: usageTypeClass(product.usageType, common, specific), unit: dimension.unit, discriminators: Object.fromEntries((specific.discriminators ?? []).filter(key => key in product.attributes).map(key => [key, product.attributes[key]])) };
    const key = encode(category);
    const entry = categories.get(key) ?? { ...category, products: [], rawUsageTypes: [], shapes: [], shapeSignatures: [] };
    entry.products.push(product.sku); entry.rawUsageTypes.push(product.usageType);
    entry.shapes.push({ beginRange: dimension.beginRange, endRange: dimension.endRange, allowance: dimension.freeAllowance === true });
    const meterDimensions = product.terms.onDemand[0].priceDimensions.filter(d => d.unit === dimension.unit).sort((a, b) => decimal(a.beginRange).cmp(b.beginRange));
    // Threshold/price differences do not alter category identity. Meter count and
    // allowance roles must still be homogeneous after suffix normalization.
    entry.shapeSignatures.push(JSON.stringify(meterDimensions.map(d => ({ unit: d.unit, allowance: d.freeAllowance === true }))));
    categories.set(key, entry);
  }
  return [...categories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => ({ ...entry, products: [...new Set(entry.products)].sort(), rawUsageTypes: [...new Set(entry.rawUsageTypes)].sort(), shapes: [...new Map(entry.shapes.map(shape => [encode(shape), shape])).values()], shapeSignatures: [...new Set(entry.shapeSignatures)].sort() }));
}
export function validateCoverage(categories, coverage) {
  const issues = [], summary = { mapped: 0, ignored: 0, unresolved: 0 };
  for (const category of categories) {
    if (category.shapeSignatures?.length > 1) issues.push(issue('CATEGORY_SHAPE_MISMATCH', `Normalizer merged heterogeneous dimension shapes: ${category.usageTypeClass}`));
    const rules = coverage.categories.filter(rule => matches(category, rule.filters));
    if (rules.length !== 1 || rules[0].status === 'unresolved') {
      summary.unresolved++;
      issues.push(issue('UNMAPPED_PRICING_CATEGORY', `Category must have one explicit mapping: ${encode({ ...category, products: undefined, rawUsageTypes: undefined, shapes: undefined })}`));
    } else summary[rules[0].status]++;
  }
  return { issues, summary };
}
