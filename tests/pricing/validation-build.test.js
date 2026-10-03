import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fixturePackage } from '../fixtures/definitions.js';
import { rawFixture } from '../fixtures/raw.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { validatePriceData } from '../../tools/pricing-cli/semantics.js';
import { runGolden } from '../../tools/pricing-cli/golden.js';
import { classifyChange } from '../../tools/pricing-cli/drift.js';
import { buildPriceDb, checksum } from '../../tools/pricing-cli/build.js';

function fixture() {
  const raw = rawFixture(), pkg = fixturePackage();
  pkg.golden = [{ schemaVersion: 1, id: 'default', profileId: 'standard', project: {}, selectors: {}, components: { meter: { inputs: { hours: '730' } } }, expected: { meter: { unit: 'Hrs', quantity: '730', attributes: { instanceType: 'm7i.large' } } }, verification: { meter: { attributes: { instanceType: 'm7i.large', regionCode: 'ap-northeast-1' }, unit: 'Hrs', quantity: '730' } } }];
  const candidate = { data: { Example: normalize(raw, 'ap-northeast-1').data }, metadata: { sources: { Example: { serviceCode: 'Example', region: 'ap-northeast-1', sourceUrl: 'https://aws.example/version/index.json', version: raw.version, publicationDate: raw.publicationDate } } } };
  return { raw, pkg, candidate };
}
test('semantic and independent raw Golden validation detect incorrect expectations', () => {
  const { raw, pkg, candidate } = fixture();
  const result = validatePriceData([pkg], candidate.data, { regionPrefixes: ['APN1-'], rules: [] }, { Example: { rules: [] } });
  assert.equal(result.issues.length, 0);
  assert.equal(runGolden([pkg], candidate.data, { Example: raw }).issues.length, 0);
  pkg.golden[0].verification.meter.quantity = '731';
  assert.equal(runGolden([pkg], candidate.data, { Example: raw }).issues[0].code, 'GOLDEN_FAILED');
});
test('price-only, new SKU, unit/ambiguity/deletion and validation failure classification', () => {
  const { pkg, candidate } = fixture();
  const previous = candidate.data;
  const next = structuredClone(previous);
  next.Example.products[0].terms.onDemand[0].priceDimensions[0].pricePerUnit.USD = '123';
  assert.equal(classifyChange([pkg], previous, next).classification, 'PRICE_ONLY');
  next.Example.products.push({ ...structuredClone(next.Example.products[0]), sku: 'new', productFamily: 'Other' });
  pkg.components.meter.priceQuery.productFilters = [{ field: 'productFamily', op: 'eq', value: 'Compute' }];
  assert.equal(classifyChange([pkg], previous, next).classification, 'STRUCTURE_WARNING');
  next.Example.products[1].productFamily = 'Compute';
  assert.equal(classifyChange([pkg], previous, next).classification, 'STRUCTURE_BREAKING');
  next.Example.products.pop(); next.Example.products[0].terms.onDemand[0].priceDimensions[0].unit = 'GB';
  assert.equal(classifyChange([pkg], previous, next).publishable, false);
  next.Example.products = [];
  assert.equal(classifyChange([pkg], previous, next).publishable, false);
});
test('immutable build has content checksums, does not promote manifest, rejects invalid candidate', async () => {
  const { candidate } = fixture();
  const root = await mkdtemp(path.join(tmpdir(), 'tae-build-'));
  await assert.rejects(() => buildPriceDb(candidate, root, 'invalid', { issues: [{ severity: 'error' }] }), /Validated/);
  const manifest = await buildPriceDb(candidate, root, 'test-build', { issues: [] });
  const source = manifest.sources.Example['ap-northeast-1'];
  const text = await readFile(path.join(root, 'builds/test-build', source.productsPath), 'utf8');
  assert.equal(checksum(text), source.productsSha256);
  assert.equal(JSON.parse(text).buildId, 'test-build');
  await assert.rejects(() => readFile(path.join(root, 'manifest.json')), /ENOENT/);
  await assert.rejects(() => buildPriceDb(candidate, root, 'test-build', { issues: [] }), /Immutable/);
});
