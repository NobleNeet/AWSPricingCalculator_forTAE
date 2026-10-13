import { writeFile, mkdir } from 'node:fs/promises';

const region = process.argv[2] ?? 'ap-northeast-1';
const out = process.argv[3] ?? 'ec2-meter-evidence.json';
const origin = 'https://pricing.us-east-1.amazonaws.com';
const codes = ['AmazonCloudWatch', 'AmazonEC2', 'AWSDataTransfer'];
const patterns = /(?:MetricMonitorUsage|DataTransfer-Out-Bytes|DataTransfer-Regional-Bytes|AWS-Out-Bytes)/;
const fetchAws = async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(1200000) });
  if (!response.ok) throw Error(`AWS pricing HTTP ${response.status}: ${url}`);
  return response.json();
};
const results = {};
for (const code of codes) {
  const index = await fetchAws(`${origin}/offers/v1.0/aws/${code}/current/region_index.json`);
  const relative = index.regions?.[region]?.currentVersionUrl;
  if (!relative?.startsWith('/offers/v1.0/aws/')) throw Error(`No AWS region price index for ${code}/${region}`);
  const offer = await fetchAws(origin + relative);
  const selected = [];
  for (const [sku, product] of Object.entries(offer.products ?? {})) {
    const attributes = product.attributes ?? {};
    if (attributes.regionCode !== region || !patterns.test(attributes.usagetype ?? '')) continue;
    const terms = Object.values(offer.terms?.OnDemand?.[sku] ?? {});
    selected.push({
      sku, productFamily: product.productFamily, usageType: attributes.usagetype, operation: attributes.operation,
      attributes: Object.fromEntries(Object.entries(attributes).filter(([k]) => /^(fromLocation|toLocation|transferType|group|groupDescription|regionCode|location)$/.test(k))),
      terms: terms.map(t => ({ effectiveDate: t.effectiveDate, dimensions: Object.values(t.priceDimensions ?? {}).map(d => ({
        unit: d.unit, beginRange: d.beginRange, endRange: d.endRange, pricePerUnit: d.pricePerUnit,
        description: d.description
      })) }))
    });
  }
  results[code] = { region, publicationDate: offer.publicationDate, sourceUrl: origin + relative, matchingProducts: selected };
  console.log(`${code}/${region}: matches=${selected.length}`);
  for (const p of selected.slice(0, 80)) {
    console.log(JSON.stringify({ sku: p.sku, family: p.productFamily, type: p.usageType, operation: p.operation, unit: p.terms?.[0]?.dimensions?.map(d => d.unit), prices: p.terms?.[0]?.dimensions?.map(d => [d.beginRange, d.endRange, d.pricePerUnit?.USD]) }));
  }
}
await writeFile(out, JSON.stringify({ schemaVersion: 1, region, results }, null, 2) + '\n');
console.log('Wrote verified AWS raw-product evidence to ' + out);
