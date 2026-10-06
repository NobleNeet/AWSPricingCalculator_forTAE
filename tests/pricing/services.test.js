import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { validateDefinitions } from '../../tools/pricing-cli/validate-definitions.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { runGolden } from '../../tools/pricing-cli/golden.js';

function mergeFixtureSupplement(base, supplement) {
  return {
    ...base,
    products: { ...base.products, ...(supplement.products ?? {}) },
    terms: {
      ...base.terms,
      OnDemand: { ...base.terms?.OnDemand, ...supplement.terms?.OnDemand }
    }
  };
}

test('all initial real service schemas and independently verified AWS Golden samples', async () => {
  const packages = await loadPackages();
  assert.ok(['ebs', 'ec2', 'eventbridge', 'kms', 'lambda', 'rds', 's3'].every(id => packages.some(pkg => pkg.service.id === id)));
  assert.deepEqual(await validateDefinitions(packages), []);
  const raw = {}, data = {};
  for (const code of new Set(packages.map(p => p.service.priceSource.serviceCode))) {
    raw[code] = await readJson(`tests/fixtures/aws/${code}.json`);
    const supplementPath = `tests/fixtures/aws/${code}.supplement.json`;
    if (existsSync(supplementPath)) raw[code] = mergeFixtureSupplement(raw[code], await readJson(supplementPath));
    data[code] = normalize(raw[code], 'ap-northeast-1').data;
  }
  const result = runGolden(packages, data, raw);
  assert.deepEqual(result.issues, []);
  assert.equal(result.cases.length, packages.reduce((count, pkg) => count + pkg.golden.length, 0));
});

test('EC2 embedded EBS models storage and provisioned performance as independent meters', async () => {
  const packages = await loadPackages();
  const ec2 = packages.find(pkg => pkg.service.id === 'ec2');
  const profile = ec2.profiles.standard;
  const ebsType = profile.selectors.find(selector => selector.id === 'ebsVolumeType');
  const storage = ec2.components.ebs;
  const gp3Iops = ec2.components['ebs-gp3-iops'];
  const gp3Throughput = ec2.components['ebs-gp3-throughput'];
  const io1Iops = ec2.components['ebs-io1-iops'];
  const io2Iops = ec2.components['ebs-io2-iops'];

  assert.deepEqual(ebsType.options.values, ['none', 'gp3', 'gp2', 'st1', 'sc1', 'io1', 'io2']);
  assert.equal(ebsType.default, 'gp3');
  assert.equal(storage.priceQuery.productFilters.find(filter => filter.field === 'attributes.volumeApiName').valueFrom, 'profile.ebsVolumeType');
  assert.deepEqual(gp3Iops.enabledWhen, { field: 'profile.ebsVolumeType', op: 'eq', value: 'gp3' });
  assert.deepEqual(gp3Throughput.enabledWhen, { field: 'profile.ebsVolumeType', op: 'eq', value: 'gp3' });
  assert.deepEqual(io1Iops.enabledWhen, { field: 'profile.ebsVolumeType', op: 'eq', value: 'io1' });
  assert.deepEqual(io2Iops.enabledWhen, { field: 'profile.ebsVolumeType', op: 'eq', value: 'io2' });
  assert.equal(gp3Iops.usageInputs[0].default, '3000');
  assert.equal(gp3Throughput.usageInputs[0].default, '125');
  assert.ok(io2Iops.limitations.includes('tier-pricing'));
});
