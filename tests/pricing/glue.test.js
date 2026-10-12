import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('Glue Definition follows the supplied Calculator pricing families', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'glue');
  assert.ok(pkg);
  assert.equal(pkg.service.priceSource.serviceCode, 'AWSGlue');
  assert.equal(pkg.profiles.standard.selectors.length, 9);
  assert.ok(pkg.profiles.standard.selectors.every(input => input.type === 'boolean' && input.default === true));
  assert.equal(pkg.components['etl-standard'].selectors[0].default, 'ETL Job Run Glue 6.0+');
  assert.equal(pkg.components['etl-standard'].calculation.outputUnit, 'DPU-Hour');
  assert.equal(pkg.components.crawlers.calculation.usage.sources[2].value.transforms[0].value, '10');
  assert.deepEqual(pkg.components['catalog-requests'].limitations, ['free-tier', 'account-specific-discount']);
  assert.equal(pkg.pricingMappings['zero-etl-ingestion'].productMatchers.find(x => x.field === 'attributes.group').value, 'ZETL Ingestion');
  assert.equal(pkg.coverage.categories.some(x => x.status === 'unresolved'), false);
});
