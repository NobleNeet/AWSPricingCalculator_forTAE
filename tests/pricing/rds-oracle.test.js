import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('RDS for Oracle drawer follows the supplied Calculator contract', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'rds-oracle');
  assert.ok(pkg);

  const profile = pkg.profiles.standard;
  assert.equal(profile.selectors.find(x => x.id === 'nodes').default, '1');
  assert.equal(profile.selectors.find(x => x.id === 'utilizationPct').default, '100');
  assert.equal(profile.selectors.find(x => x.id === 'utilizationPct').maximum, '100');
  assert.equal(profile.selectors.find(x => x.id === 'deployment').default, 'Multi-AZ');
  assert.equal(profile.selectors.find(x => x.id === 'licenseModel').default, 'Bring your own license');
  assert.equal(profile.selectors.find(x => x.id === 'databaseEdition').default, 'Enterprise');

  const edition = profile.selectors.find(x => x.id === 'databaseEdition');
  assert.equal(edition.options.attribute, 'databaseEdition');
  assert.equal(
    edition.options.filters.find(x => x.field === 'attributes.licenseModel').valueFrom,
    'profile.licenseModel'
  );

  const instance = pkg.components.instance;
  assert.equal(instance.selectors.find(x => x.id === 'instanceType').default, 'db.m3.2xlarge');
  assert.equal(
    instance.priceQuery.productFilters.find(x => x.field === 'attributes.databaseEngine').value,
    'Oracle'
  );
  assert.equal(
    instance.priceQuery.productFilters.find(x => x.field === 'attributes.deploymentModel').op,
    'notExists'
  );
  assert.equal(
    instance.calculation.usage.sources[0].value.transforms[0].factor,
    '7.3'
  );
  assert.equal(instance.calculation.usage.sources[1].valueFrom, 'profile.nodes');

  const storage = pkg.components['storage-gp3'];
  assert.equal(
    storage.priceQuery.productFilters.find(x => x.field === 'attributes.volumeType').value,
    'General Purpose-GP3'
  );
  assert.equal(
    storage.priceQuery.productFilters.find(x => x.field === 'operation').value,
    'CreateDBInstance:0005'
  );

  assert.deepEqual(pkg.service.pricingMappings, ['instance', 'storage-gp3']);
});
