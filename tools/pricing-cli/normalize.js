import { decimal } from '../../src/pricing/decimal.js';
import { fail } from '../../src/pricing/issues.js';

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
export const encode = value => `${JSON.stringify(stable(value), null, 2)}\n`;
export function buildIndex(products, buildId, serviceCode, region) {
  const values = {};
  for (const product of products) for (const [key, value] of Object.entries(product.attributes)) (values[key] ??= new Set()).add(value);
  return { schemaVersion: 1, buildId, serviceCode, region, attributes: Object.fromEntries(Object.entries(values).sort().map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))])) };
}
export function normalize(raw, region, buildId = 'candidate') {
  if (!raw.offerCode || !raw.publicationDate) fail('INVALID_SOURCE', 'AWS source metadata missing.');
  const products = [];
  for (const [sku, source] of Object.entries(raw.products).sort(([a], [b]) => a.localeCompare(b))) {
    if (source.attributes.regionCode !== region) continue;
    const allTerms = Object.values(raw.terms?.OnDemand?.[sku] ?? {}).filter(term => term.effectiveDate <= raw.publicationDate);
    if (!allTerms.length) continue;
    const latest = allTerms.map(term => term.effectiveDate).sort().at(-1);
    const current = allTerms.filter(term => term.effectiveDate === latest);
    if (current.length !== 1) fail('MULTIPLE_ACTIVE_TERMS', `Multiple active terms for ${sku}.`);
    const term = current[0];
    const dimensions = Object.values(term.priceDimensions).sort((a, b) => a.rateCode.localeCompare(b.rateCode)).map(d => {
      if (typeof d.pricePerUnit?.USD !== 'string' || typeof d.beginRange !== 'string' || typeof d.endRange !== 'string') fail('INVALID_PRICE', `Non-string USD/range for ${sku}.`);
      decimal(d.pricePerUnit.USD); decimal(d.beginRange);
      if (d.endRange !== 'Inf') decimal(d.endRange);
      const result = { rateCode: d.rateCode, description: d.description, unit: d.unit, beginRange: d.beginRange, endRange: d.endRange, pricePerUnit: { USD: d.pricePerUnit.USD } };
      if (decimal(d.pricePerUnit.USD).isZero() && /\b(free tier|free usage|free allowance|first [\d,.]+ .* free)\b/i.test(d.description)) {
        result.freeAllowance = true; result.allowanceEvidence = d.description;
      }
      return result;
    });
    products.push({ sku, productFamily: source.productFamily ?? '', operation: source.attributes.operation ?? '', usageType: source.attributes.usagetype ?? '', attributes: stable(source.attributes), terms: { onDemand: [{ offerTermCode: term.offerTermCode, effectiveDate: term.effectiveDate, priceDimensions: dimensions }] } });
  }
  const data = { schemaVersion: 1, buildId, serviceCode: raw.offerCode, region, products };
  return { data, index: buildIndex(products, buildId, raw.offerCode, region), source: { serviceCode: raw.offerCode, region, version: raw.version, publicationDate: raw.publicationDate } };
}
