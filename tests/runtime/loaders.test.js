import test from 'node:test';
import assert from 'node:assert/strict';
import { PriceDataStore } from '../../src/runtime/price-data-store.js';
import { DefinitionStore } from '../../src/runtime/definition-store.js';

function network() {
  let active = 'build-a'; const counts = {}, failures = new Set();
  const fetcher = async url => {
    counts[url] = (counts[url] ?? 0) + 1;
    if (failures.has(url)) throw Error('offline');
    let data;
    if (url.endsWith('/manifest.json')) data = { schemaVersion: 1, activeBuildId: active, publicationDate: '2026-01-01' };
    else if (url.endsWith('/build-manifest.json')) {
      const buildId = url.includes('build-a') ? 'build-a' : 'build-b';
      data = { schemaVersion: 1, buildId, currency: 'USD', publicationDate: '2026-01-01', sources: Object.fromEntries(['EC2', 'S3'].map(code => [code, { 'ap-northeast-1': { productsPath: `sources/${code}/ap-northeast-1/products.json`, indexPath: `indexes/${code}/ap-northeast-1/index.json` } }])) };
    } else data = { schemaVersion: 1, buildId: url.includes('build-a') ? 'build-a' : 'build-b', serviceCode: url.includes('/EC2/') ? 'EC2' : 'S3', region: 'ap-northeast-1', products: [], attributes: {} };
    return { ok: true, text: async () => JSON.stringify(data) };
  };
  return { fetcher, counts, failures, setActive: value => active = value };
}
test('pin one build, deduplicate concurrent products, new tab takes new active, independent index', async () => {
  const net = network(), store = new PriceDataStore({ fetcher: net.fetcher });
  const results = await Promise.all([store.products('EC2', 'ap-northeast-1'), store.products('EC2', 'ap-northeast-1')]);
  assert.equal(results[0], results[1]);
  assert.equal(net.counts['./pricing/generated/builds/build-a/sources/EC2/ap-northeast-1/products.json'], 1);
  net.setActive('build-b');
  assert.equal(await store.checkLatest(), true);
  assert.equal((await store.products('S3', 'ap-northeast-1')).buildId, 'build-a');
  assert.equal((await store.index('EC2', 'ap-northeast-1')).buildId, 'build-a');
  assert.equal((await new PriceDataStore({ fetcher: net.fetcher }).products('EC2', 'ap-northeast-1')).buildId, 'build-b');
});
test('failure isolation, explicit retry, stale cached prices and generation mismatch rejection', async () => {
  const net = network(), store = new PriceDataStore({ fetcher: net.fetcher });
  const failing = './pricing/generated/builds/build-a/sources/EC2/ap-northeast-1/products.json';
  net.failures.add(failing);
  await assert.rejects(() => store.products('EC2', 'ap-northeast-1'), /offline/);
  assert.equal(store.state('EC2', 'ap-northeast-1').state, 'unavailable');
  await store.products('S3', 'ap-northeast-1');
  net.failures.delete(failing); await store.products('EC2', 'ap-northeast-1');
  net.failures.add('./pricing/generated/manifest.json');
  assert.equal(await store.checkLatest(), true);
  assert.equal((await store.products('EC2', 'ap-northeast-1')).buildId, 'build-a');
  const bad = new PriceDataStore({ fetcher: async url => { const r = await net.fetcher(url); return url.endsWith('products.json') ? { ok: true, text: async () => JSON.stringify({ schemaVersion: 1, buildId: 'other', serviceCode: 'S3', region: 'ap-northeast-1', products: [] }) } : r; } });
  net.failures.clear(); await assert.rejects(() => bad.products('S3', 'ap-northeast-1'), /Invalid resource/);
});
test('Definition cache deduplicates package fetches and validates safe reference paths', async () => {
  const counts = {};
  const data = {
    'service.json': { schemaVersion: 1, id: 'example', label: 'Example', profiles: ['standard'], defaultProfile: 'standard', priceSource: { serviceCode: 'Example' }, pricingMappings: ['meter'] },
    'standard.json': { schemaVersion: 1, id: 'standard', selectors: [], fixedFilters: [], components: ['meter'] },
    'meter.json': { schemaVersion: 1, id: 'meter', priceQuery: { expect: 'singleSku' }, calculation: { model: 'unit' }, selectors: [], usageInputs: [], limitations: [] },
    'mapping:meter.json': { schemaVersion: 1, id: 'meter', componentId: 'meter', priceSource: { serviceCode: 'Example' }, productMatchers: [], dimensionMatchers: [], expect: { products: 1, billableDimensions: 1 } }
  };
  const store = new DefinitionStore({ fetcher: async url => {
    counts[url] = (counts[url] ?? 0) + 1;
    const name = url.split('/').at(-1);
    const body = url.includes('/pricing-mappings/') ? data[`mapping:${name}`] : data[name];
    return { ok: true, text: async () => JSON.stringify(body) };
  } });
  const [first, second] = await Promise.all([store.package('example'), store.package('example')]);
  assert.equal(first, second);
  assert.equal(first.pricingMappings.meter.componentId, 'meter');
  assert.equal(Object.values(counts).every(n => n === 1), true);
  await assert.rejects(() => store.package('../outside'), /Invalid service ID/);
});
