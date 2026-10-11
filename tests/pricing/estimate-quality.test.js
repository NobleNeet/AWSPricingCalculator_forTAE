import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { evaluateService } from '../../src/pricing/core.js';
import { applyPlanBilling } from '../../src/pricing/plan-billing.js';
import { fillDefinitionDefaults } from '../../src/app/drawer-state-model.js';

async function fixture(id) {
  const pkg = (await loadPackages()).find(pkg => pkg.service.id === id);
  const raw = await readJson(`tests/fixtures/aws/${pkg.service.priceSource.serviceCode}.json`);
  return { pkg, products: normalize(raw, 'ap-northeast-1').data.products };
}
test('RDS capacity mode follows instance count; aggregate mode validates physical feasibility', async () => {
  const { pkg, products } = await fixture('rds');
  const instance = structuredClone(pkg.golden[0]);
  instance.components.instance.inputs.quantity = '2';
  instance.components.instance.inputs.hours = '730';
  instance.components.storage = { enabled: true, inputs: { usageMode: 'capacity', capacityGb: '20', storageHours: '730' } };
  let result = evaluateService(pkg, instance, { region: 'ap-northeast-1' }, products);
  assert.equal(result.components.storage.billingQuantity, '40');
  instance.components.storage.inputs = { usageMode: 'aggregate', gbMonths: '20' };
  result = evaluateService(pkg, instance, { region: 'ap-northeast-1' }, products);
  assert.equal(result.amountUsd, null);
  assert.ok(result.issues.some(issue => issue.code === 'INVALID_INPUT_COMBINATION'));
  instance.components.instance.inputs.hours = '10';
  instance.components.storage.inputs.gbMonths = '1';
  result = evaluateService(pkg, instance, { region: 'ap-northeast-1' }, products);
  assert.notEqual(result.amountUsd, null, JSON.stringify(result.issues));
  assert.equal(result.components.storage.billingQuantity, '1');
});

test('restored aggregate values retain their meaning; fresh capacity input remains capacity', async () => {
  const { pkg } = await fixture('rds');
  const instance = { profileId: 'standard', selectors: {}, components: { storage: { inputs: { gbMonths: '1' } } } };
  fillDefinitionDefaults(pkg, instance);
  assert.equal(instance.components.storage.inputs.usageMode, 'aggregate');
  assert.equal(instance.components.storage.inputs.gbMonths, '1');
  instance.components.storage.inputs.usageMode = 'capacity';
  fillDefinitionDefaults(pkg, instance);
  assert.equal(instance.components.storage.inputs.usageMode, 'capacity');
});

function entry(id, planId, region, group, quantity = '730', price = '2') {
  const amountUsd = String(Number(quantity) * Number(price));
  return { id, planId, region, result: { state: 'ready', amountUsd, issues: [], components: { fee: { state: 'ready', amountUsd, billingQuantity: quantity, unitPriceUsd: price, billingGroup: group } } } };
}
test('Dedicated duplicate detection is per Plan/Region; disabling/removing a duplicate recovers', () => {
  const group = { id: 'dedicated', scope: 'plan-region', policy: 'unique' };
  const entries = [entry('a','p','Tokyo',group),entry('b','p','Tokyo',group),entry('c','q','Tokyo',group),entry('d','p','Osaka',group)];
  const results = applyPlanBilling(entries);
  assert.equal(results.get('a').amountUsd,null); assert.equal(results.get('b').amountUsd,null);
  assert.equal(results.get('c').amountUsd,'1460'); assert.equal(results.get('d').amountUsd,'1460');
  assert.equal(applyPlanBilling(entries.filter(entry=>entry.id!=='b')).get('a').amountUsd,'1460');
  assert.equal(entries[0].result.amountUsd,'1460');
});
test('Scheduler allowance is shared across rows and Regions, with independent alternative Plans', () => {
  const group = { id:'free',scope:'plan',policy:'allowance',remainingFrom:'remaining',maximumAllowance:'14000000' };
  const entries=[entry('a','p','Tokyo',group,'10000000','.000001'),entry('b','p','Osaka',group,'10000000','.000001'),entry('c','q','Tokyo',group,'10000000','.000001')];
  const results=applyPlanBilling(entries,{remaining:'14000000'});
  assert.equal(results.get('a').amountUsd,'0'); assert.equal(results.get('b').amountUsd,'6'); assert.equal(results.get('c').amountUsd,'0');
  assert.equal(results.get('b').grossAmountUsd,'10'); assert.equal(results.get('b').components.fee.allowanceApplied,'4000000');
  assert.equal(applyPlanBilling(entries).get('a').amountUsd,'10');
  assert.equal(applyPlanBilling(entries,{remaining:'14000001'}).get('a').amountUsd,null);
  entries[1].result.components.fee.unitPriceUsd='.00000125';
  assert.equal(applyPlanBilling(entries,{remaining:'14000000'}).get('a').amountUsd,null);
});
