import test from 'node:test';
import assert from 'node:assert/strict';
import { schemaValidator } from '../../tools/schema.js';

test('central schemas load and reject unknown fields / executable query', async () => {
  for (const name of ['service', 'profile', 'component', 'pricing-mapping']) assert.equal(typeof await schemaValidator(`service-definition/${name}`), 'function');
  const validate = await schemaValidator('service-definition/service');
  const service = { schemaVersion: 1, id: 'example', label: 'Example', priceSource: { serviceCode: 'Example' }, profiles: ['standard'], defaultProfile: 'standard' };
  assert.equal(validate(service), true);
  assert.equal(validate({ ...service, price: '1' }), false);
});

test('pricing mapping schema encodes deterministic matchers and cardinality', async () => {
  const validate = await schemaValidator('service-definition/pricing-mapping');
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
  assert.equal(validate(mapping), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...mapping, sku: 'fixed-sku' }), false);
  assert.equal(validate({ ...mapping, expect: { products: 0, billableDimensions: 1 } }), false);
});
