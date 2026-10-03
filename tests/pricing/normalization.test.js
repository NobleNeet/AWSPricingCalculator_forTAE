import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, encode } from '../../tools/pricing-cli/normalize.js';
import { inventory, validateCoverage } from '../../tools/pricing-cli/inventory.js';
import { checkSources, downloadSources } from '../../tools/pricing-cli/source.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { rawFixture } from '../fixtures/raw.js';
test('deterministic normalization and index preserve decimal strings, only regional OnDemand', () => {
  const raw = rawFixture();
  const first = normalize(raw, 'ap-northeast-1');
  raw.products = Object.fromEntries(Object.entries(raw.products).reverse());
  assert.equal(encode(first), encode(normalize(raw, 'ap-northeast-1')));
  assert.equal(first.data.products.length, 1);
  assert.equal(first.data.products[0].terms.onDemand[0].priceDimensions[0].pricePerUnit.USD, '0.1234000000');
  assert.deepEqual(first.index.attributes.instanceType, ['m7i.large']);
  raw.terms.OnDemand.A.extra = raw.terms.OnDemand.A['A.ondemand'];
  assert.throws(() => normalize(raw, 'ap-northeast-1'), e => e.issue.code === 'MULTIPLE_ACTIVE_TERMS');
});
test('inventory traces raw usages and requires unique coverage mapping', () => {
  const data = normalize(rawFixture(), 'ap-northeast-1').data;
  const categories = inventory(data, { regionPrefixes: ['APN1-'], rules: [] }, { rules: [{ prefix: 'BoxUsage:', class: 'BoxUsage' }], discriminators: [] });
  assert.equal(categories[0].usageTypeClass, 'BoxUsage');
  assert.deepEqual(categories[0].rawUsageTypes, ['APN1-BoxUsage:m7i.large']);
  assert.equal(validateCoverage(categories, { categories: [] }).issues[0].code, 'UNMAPPED_PRICING_CATEGORY');
  assert.equal(validateCoverage(categories, { categories: [{ filters: [{ field: 'usageTypeClass', op: 'eq', value: 'BoxUsage' }], status: 'mapped', componentId: 'meter' }] }).summary.unresolved, 0);
  const changed = structuredClone(data.products[0]); changed.sku = 'different-shape'; changed.terms.onDemand[0].priceDimensions.push({ ...changed.terms.onDemand[0].priceDimensions[0], beginRange: '10' }); data.products.push(changed);
  const mixed = inventory(data, { regionPrefixes: ['APN1-'], rules: [] }, { rules: [{ prefix: 'BoxUsage:', class: 'BoxUsage' }] });
  assert.ok(validateCoverage(mixed, { categories: [{ filters: [], status: 'ignored', reason: 'test' }] }).issues.some(i => i.code === 'CATEGORY_SHAPE_MISMATCH'));
});
test('metadata unchanged skips bulk download', async () => {
  let fetchCount = 0;
  const fetcher = async () => { fetchCount++; return { ok: true, json: async () => ({ publicationDate: '2026-01-01T00:00:00Z', regions: { 'ap-northeast-1': { currentVersionUrl: '/offers/v1.0/aws/Example/20260101000000/ap-northeast-1/index.json' } } }) }; };
  const config = { serviceCodes: ['Example'], region: 'ap-northeast-1' };
  const first = await checkSources(config, {}, fetcher);
  const next = await checkSources(config, first.sources, fetcher);
  assert.equal(next.status, 'NO_CHANGE');
  assert.deepEqual(await downloadSources(next, await mkdtemp(path.join(tmpdir(), 'tae-download-')), fetcher), []);
  assert.equal(fetchCount, 2);
});
