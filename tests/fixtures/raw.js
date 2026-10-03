export function rawFixture() {
  const dimension = { rateCode: 'A.rate', description: 'compute hour', unit: 'Hrs', beginRange: '0', endRange: 'Inf', pricePerUnit: { USD: '0.1234000000' } };
  const term = { offerTermCode: 'ondemand', effectiveDate: '2026-01-01T00:00:00Z', priceDimensions: { 'A.rate': dimension } };
  return { offerCode: 'Example', version: '20260101000000', publicationDate: '2026-01-01T00:00:00Z', products: { A: { sku: 'A', productFamily: 'Compute', attributes: { regionCode: 'ap-northeast-1', operation: 'RunInstances', usagetype: 'APN1-BoxUsage:m7i.large', instanceType: 'm7i.large' } }, B: { sku: 'B', attributes: { regionCode: 'us-east-1' } } }, terms: { OnDemand: { A: { 'A.ondemand': term } }, Reserved: { A: { ignored: {} } } } };
}
