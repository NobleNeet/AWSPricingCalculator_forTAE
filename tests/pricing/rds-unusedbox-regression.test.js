import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { matches } from '../../src/pricing/filter.js';
import { usageTypeClass, validateCoverage } from '../../tools/pricing-cli/inventory.js';

const json = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const normalizer = await json('../../pricing/normalization/services/AmazonRDS.json');
const common = await json('../../pricing/normalization/common.json');

test('RDS UnusedBox is normalized separately from billable instance hours', () => {
  assert.equal(usageTypeClass('APN1-UnusedBox:db.r8a.16xl', common, normalizer), 'UnusedBox');
  assert.equal(usageTypeClass('APN1-InstanceUsage:db.r8a.16xl', common, normalizer), 'InstanceUsage');
});

test('RDS instance filters exclude UnusedBox while accepting billable instances', async () => {
  for (const service of ['rds', 'rds-oracle']) {
    const component = await json(`../../services/${service}/components/instance.json`);
    const filters = component.priceQuery.productFilters;
    const product = {
      productFamily: 'Database Instance',
      attributes: {
        databaseEngine: service === 'rds' ? 'PostgreSQL' : 'Oracle',
        deploymentOption: 'Single-AZ',
        licenseModel: service === 'rds' ? 'No license required' : 'Bring your own license',
        databaseEdition: 'Enterprise',
        instanceType: 'db.r6i.2xlarge'
      }
    };
    const context = { profile: { deployment: 'Single-AZ', licenseModel: 'Bring your own license', databaseEdition: 'Enterprise' }, component: { instanceType: 'db.r6i.2xlarge' } };
    assert.equal(matches(product, filters, context), false, service);
    assert.equal(matches({ ...product, attributes: { ...product.attributes, vcpu: '8' } }, filters, context), true, service);
  }
});

test('RDS coverage explicitly classifies normalized UnusedBox categories', async () => {
  for (const service of ['rds', 'aurora-postgresql']) {
    const coverage = await json(`../../services/${service}/coverage.json`);
    const categories = [{
      productFamily: 'Database Instance',
      operation: 'CreateDBInstance:0014',
      usageTypeClass: 'UnusedBox',
      unit: 'Hrs',
      discriminators: { databaseEngine: 'PostgreSQL', deploymentOption: 'Single-AZ', licenseModel: 'No license required' },
      shapeSignatures: ['[{"unit":"Hrs","allowance":false}]']
    }];
    const result = validateCoverage(categories, coverage);
    assert.equal(result.issues.length, 0, service);
    assert.equal(result.summary.ignored, 1, service);
  }
});
