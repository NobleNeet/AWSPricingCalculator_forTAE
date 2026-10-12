import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { evaluateService } from '../../src/pricing/core.js';

const pkg = (await loadPackages()).find(p => p.service.id === 'redshift');
const raw = await readJson('tests/fixtures/aws/AmazonRedshift.json');
const products = normalize(raw, 'ap-northeast-1').data.products;
const project = { region: 'ap-northeast-1', hoursPerMonth: '730' };

function sample(id) {
  const value = pkg.golden.find(g => g.id === id);
  assert.ok(value, id + ' must exist');
  return structuredClone(value);
}

test('Redshift provisioned computes one node at actual Tokyo on-demand rate', () => {
  const result = evaluateService(pkg, sample('tokyo-redshift-provisioned'), project, products);
  assert.notEqual(result.amountUsd, null, JSON.stringify(result.issues));
  assert.equal(result.components['node-compute'].billingQuantity, '730');
  assert.equal(result.components['node-compute'].unitPriceUsd, '6.095');
  assert.equal(result.components['node-compute'].amountUsd, '4449.35');
  assert.equal(result.amountUsd, '4449.35');
  assert.equal(result.components['rms-provisioned'].state, 'disabled');
  assert.equal(result.components['backup-rg'].state, 'disabled');
  assert.equal(result.components['spectrum'].amountUsd, '0');
});

test('Redshift Serverless excludes commitment products and has no separate Spectrum meter', () => {
  const result = evaluateService(pkg, sample('tokyo-redshift-serverless'), project, products);
  assert.notEqual(result.amountUsd, null, JSON.stringify(result.issues));
  const compute = result.components['serverless-compute'];
  assert.equal(compute.billingQuantity, '3904');
  assert.equal(compute.unitPriceUsd, '0.494');
  assert.equal(compute.amountUsd, '1928.576');
  assert.equal(compute.resolution.product.attributes.usagetype, 'APN1-Redshift:ServerlessUsage');
  assert.equal(result.components['rms-serverless'].amountUsd, '0.261');
  assert.equal(result.amountUsd, '1928.837');
  assert.equal(result.components.spectrum, undefined);
  assert.equal(result.components['node-compute'], undefined);
});

test('RG node activates unique snapshot price, not tiered paid snapshots', () => {
  const g = sample('tokyo-redshift-provisioned');
  g.selectors.instanceType='rg.large';
  g.components['backup-rg']={enabled:true,inputs:{backupGb:'10'}};
  g.components['rms-provisioned']={enabled:true,inputs:{managedGb:'10'}};
  const r=evaluateService(pkg,g,project,products);
  assert.notEqual(r.amountUsd,null,JSON.stringify(r.issues));
  assert.equal(r.components['backup-tiered'].state,'disabled');
  assert.equal(r.components['backup-rg'].amountUsd,'0.25');
  assert.equal(r.components['rms-provisioned'].amountUsd,'0.261');
  assert.equal(r.components['node-compute'].amountUsd,'326.529');
});
