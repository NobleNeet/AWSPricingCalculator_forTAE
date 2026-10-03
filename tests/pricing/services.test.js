import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { validateDefinitions } from '../../tools/pricing-cli/validate-definitions.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { runGolden } from '../../tools/pricing-cli/golden.js';

test('all initial real service schemas and independently verified AWS Golden samples', async () => {
  const packages = await loadPackages();
  assert.deepEqual(packages.map(p => p.service.id), ['ebs', 'ec2', 'lambda', 'rds', 's3']);
  assert.deepEqual(await validateDefinitions(packages), []);
  const raw = {}, data = {};
  for (const code of new Set(packages.map(p => p.service.priceSource.serviceCode))) {
    raw[code] = await readJson(`tests/fixtures/aws/${code}.json`);
    data[code] = normalize(raw[code], 'ap-northeast-1').data;
  }
  const result = runGolden(packages, data, raw);
  assert.deepEqual(result.issues, []);
  assert.equal(result.cases.length, 11);
});
