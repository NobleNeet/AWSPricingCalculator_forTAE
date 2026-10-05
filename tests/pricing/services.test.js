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
  assert.ok(['ebs', 'ec2', 'lambda', 'rds', 's3'].every(id => packages.some(pkg => pkg.service.id === id)));
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

test('EC2 embedded EBS exposes storage-priced volume types without provisioned-performance meters', async () => {
  const packages = await loadPackages();
  const ec2 = packages.find(pkg => pkg.service.id === 'ec2');
  const ebs = ec2.components.find(component => component.id === 'ebs');
  const volumeType = ebs.selectors.find(selector => selector.id === 'volumeType');

  assert.deepEqual(volumeType.options.values, ['gp3', 'gp2', 'st1', 'sc1']);
  assert.equal(volumeType.default, 'gp3');
  assert.equal(ebs.priceQuery.productFilters.find(filter => filter.field === 'attributes.volumeApiName').valueFrom, 'component.volumeType');
  assert.equal(ebs.calculation.outputUnit, 'GB-Mo');
});
