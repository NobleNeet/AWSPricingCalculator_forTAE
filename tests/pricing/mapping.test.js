import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePricingMapping } from '../../src/pricing/mapping.js';

function product({ sku = 'SKU1', unit = 'GB-Mo', volumeApiName = 'gp3' } = {}) {
  return {
    sku,
    productFamily: 'Storage',
    operation: '',
    usageType: 'APN1-EBS:VolumeUsage.gp3',
    attributes: { volumeApiName },
    terms: {
      onDemand: [{
        priceDimensions: [{
          rateCode: `${sku}.rate`,
          description: 'storage',
          unit,
          beginRange: '0',
          endRange: 'Inf',
          pricePerUnit: { USD: '0.08' }
        }]
      }]
    }
  };
}

const mapping = {
  schemaVersion: 1,
  id: 'storage',
  componentId: 'storage',
  priceSource: { serviceCode: 'AmazonEC2' },
  productMatchers: [
    { field: 'productFamily', op: 'eq', value: 'Storage' },
    { field: 'attributes.volumeApiName', op: 'eq', valueFrom: 'profile.volume' }
  ],
  dimensionMatchers: [
    { field: 'unit', op: 'in', value: ['GB-Mo', 'GB-month'] }
  ],
  expect: { products: 1, billableDimensions: 1 }
};

test('pricing mapping resolves service-specific aliases without generic normalization', () => {
  const context = { project: {}, profile: { volume: 'gp3' }, component: {} };
  for (const unit of ['GB-Mo', 'GB-month']) {
    const result = resolvePricingMapping([product({ unit })], mapping, context);
    assert.equal(result.product.sku, 'SKU1');
    assert.equal(result.dimension.unit, unit);
  }
});

test('pricing mapping fails closed when product cardinality drifts', () => {
  const context = { project: {}, profile: { volume: 'gp3' }, component: {} };
  assert.throws(
    () => resolvePricingMapping([product({ sku: 'SKU1' }), product({ sku: 'SKU2' })], mapping, context),
    error => error.issue?.code === 'MAPPING_PRODUCT_CARDINALITY'
  );
});

test('pricing mapping fails closed when accepted dimension semantics drift', () => {
  const context = { project: {}, profile: { volume: 'gp3' }, component: {} };
  assert.throws(
    () => resolvePricingMapping([product({ unit: 'GB-NewUnit' })], mapping, context),
    error => error.issue?.code === 'MAPPING_DIMENSION_CARDINALITY'
  );
});
