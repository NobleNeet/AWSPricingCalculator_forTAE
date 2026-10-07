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
import { driftTasks } from '../../tools/pricing-cli/drift-parallel.js';
import { buildPriceDb, checksum } from '../../tools/pricing-cli/build.js';

const key = 'Example/ap-northeast-1';
function fixture() {
  const raw = rawFixture(), pkg = fixturePackage();
  pkg.golden = [{ schemaVersion: 1, id: 'default', profileId: 'standard', project: { region: 'ap-northeast-1' }, selectors: {}, components: { meter: { inputs: { hours: '730' } } }, expected: { meter: { unit: 'Hrs', quantity: '730', attributes: { instanceType: 'm7i.large' } } }, verification: { meter: { attributes: { instanceType: 'm7i.large', regionCode: 'ap-northeast-1' }, unit: 'Hrs', quantity: '730' } } }];
  const candidate = { data: { [key]: normalize(raw, 'ap-northeast-1').data }, metadata: { sources: { [key]: { serviceCode: 'Example', region: 'ap-northeast-1', sourceUrl: 'https://aws.example/version/index.json', version: raw.version, publicationDate: raw.publicationDate } } } };
  return { raw, pkg, candidate };
}
test('semantic and independent raw Golden validation detect incorrect expectations', () => {
  const { raw, pkg, candidate } = fixture();
  const result = validatePriceData([pkg], candidate.data, { regionPrefixes: ['APN1-'], rules: [] }, { Example: { rules: [] } });
  assert.equal(result.issues.length, 0);
  assert.equal(runGolden([pkg], candidate.data, { [key]: raw }).issues.length, 0);
  pkg.golden[0].verification.meter.quantity = '731';
  assert.equal(runGolden([pkg], candidate.data, { [key]: raw }).issues[0].code, 'GOLDEN_FAILED');
});
test('numeric profile conditions are probed so conditional meters remain semantically reachable', () => {
  const { pkg, candidate } = fixture();
  pkg.profiles.standard.selectors = [{ id: 'requestCount', label: 'Requests', type: 'number', default: '0', minimum: '0' }];
  pkg.components.meter.enabledWhen = { field: 'profile.requestCount', op: 'neq', value: '0' };
  const result = validatePriceData([pkg], candidate.data, { regionPrefixes: ['APN1-'], rules: [] }, { Example: { rules: [] } });
  assert.equal(result.issues.length, 0);
  const resolution = result.resolutions.find(item => item.componentId === 'meter');
  assert.ok(resolution);
  assert.notEqual(resolution.instance.selectors.requestCount, '0');
});
test('coverage inventory is canonical while supported pricing resolves in every region', () => {
  const { pkg, candidate } = fixture();
  pkg.components.meter.priceQuery.productFilters = [{ field: 'productFamily', op: 'eq', value: 'Compute' }];
  pkg.coverage = { schemaVersion: 1, categories: [{ filters: [{ field: 'productFamily', op: 'eq', value: 'Compute' }], status: 'mapped', componentId: 'meter' }] };
  const secondary = structuredClone(candidate.data[key]);
  secondary.region = 'us-east-1';
  secondary.products[0].attributes.regionCode = 'us-east-1';
  secondary.products.push({ ...structuredClone(secondary.products[0]), sku: 'region-only', productFamily: 'Region only unrelated category' });
  candidate.data['Example/us-east-1'] = secondary;
  const result = validatePriceData([pkg], candidate.data, { regionPrefixes: ['APN1-'], rules: [] }, { Example: { rules: [] } });
  assert.equal(result.issues.length, 0);
  assert.deepEqual(Object.keys(result.coverage), ['example/ap-northeast-1']);
  assert.ok(result.resolutions.some(resolution => resolution.region === 'us-east-1'));
});
test('price-only, new SKU, unit/ambiguity/deletion and validation failure classification', () => {
  const { pkg, candidate } = fixture();
  const previous = candidate.data;
  const next = structuredClone(previous);
  next[key].products[0].terms.onDemand[0].priceDimensions[0].pricePerUnit.USD = '123';
  assert.equal(classifyChange([pkg], previous, next).classification, 'PRICE_ONLY');
  next[key].products.push({ ...structuredClone(next[key].products[0]), sku: 'new', productFamily: 'Other' });
  pkg.components.meter.priceQuery.productFilters = [{ field: 'productFamily', op: 'eq', value: 'Compute' }];
  assert.equal(classifyChange([pkg], previous, next).classification, 'STRUCTURE_WARNING');
  next[key].products[1].productFamily = 'Compute';
  assert.equal(classifyChange([pkg], previous, next).classification, 'STRUCTURE_BREAKING');
  next[key].products.pop(); next[key].products[0].terms.onDemand[0].priceDimensions[0].unit = 'GB';
  assert.equal(classifyChange([pkg], previous, next).publishable, false);
  next[key].products = [];
  assert.equal(classifyChange([pkg], previous, next).publishable, false);
});
test('drift tasks include component-level price sources and only require source descriptors', () => {
  const { pkg } = fixture();
  pkg.service.priceSource.componentOverrides = { meter: 'Auxiliary' };
  const previous = {
    'Example/ap-northeast-1': { serviceCode: 'Example', region: 'ap-northeast-1' },
    'Auxiliary/ap-northeast-1': { serviceCode: 'Auxiliary', region: 'ap-northeast-1' }
  };
  const candidate = structuredClone(previous);
  const { tasks, missingService } = driftTasks([pkg], previous, candidate, {});
  assert.equal(missingService, false);
  assert.deepEqual(tasks.map(task => task.serviceCode).sort(), ['Auxiliary', 'Example']);
  assert.ok(tasks.every(task => !Object.hasOwn(task, 'products')));
});
test('immutable build has content checksums, does not promote manifest, rejects invalid candidate', async () => {
  const { candidate } = fixture();
  const root = await mkdtemp(path.join(tmpdir(), 'tae-build-'));
  await assert.rejects(() => buildPriceDb(candidate, root, 'invalid', { issues: [{ severity: 'error' }] }), /Validated/);
  const manifest = await buildPriceDb(candidate, root, 'test-build', {
    issues: [],
    publicationSha256: 'f'.repeat(64)
  });
  assert.equal(manifest.publicationSha256, 'f'.repeat(64));
  const source = manifest.sources.Example['ap-northeast-1'];
  const text = await readFile(path.join(root, 'builds/test-build', source.productsPath), 'utf8');
  assert.equal(checksum(text), source.productsSha256);
  assert.equal(JSON.parse(text).buildId, 'test-build');
  await assert.rejects(() => readFile(path.join(root, 'manifest.json')), /ENOENT/);
  await assert.rejects(() => buildPriceDb(candidate, root, 'test-build', { issues: [] }), /Immutable/);
});
