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


test('build manifest schema accepts persisted contract fingerprints and rejects transient source flags', async () => {
  const validate = await schemaValidator('pricing/build-manifest');
  const manifest = {
    schemaVersion: 1,
    buildId: '20261006T000000Z-test',
    generatedAt: '2026-10-06T00:00:00Z',
    publicationDate: '2026-10-06T00:00:00Z',
    currency: 'USD',
    definitionSha256: 'a'.repeat(64),
    contractFingerprints: {
      schemaVersion: 1,
      global: 'b'.repeat(64),
      services: {
        lambda: 'c'.repeat(64)
      }
    },
    sources: {
      AWSLambda: {
        'ap-northeast-1': {
          serviceCode: 'AWSLambda',
          region: 'ap-northeast-1',
          sourceUrl: 'https://example.invalid/source',
          metadataUrl: 'https://example.invalid/meta',
          publicationDate: '2026-10-06T00:00:00Z',
          version: '20261006000000',
          productsPath: 'sources/AWSLambda/ap-northeast-1/products.json',
          indexPath: 'indexes/AWSLambda/ap-northeast-1/index.json',
          productsSha256: 'd'.repeat(64),
          indexSha256: 'e'.repeat(64),
          productsBytes: 1,
          indexBytes: 1,
          chunkManifestPath: 'chunks/AWSLambda/ap-northeast-1/manifest.json',
          chunkCount: 1
        }
      }
    }
  };
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  manifest.sources.AWSLambda['ap-northeast-1'].awsChanged = true;
  assert.equal(validate(manifest), false);
});
