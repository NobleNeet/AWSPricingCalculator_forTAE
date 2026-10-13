import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate } from '../../src/pricing/calculation.js';
import { evaluateService } from '../../src/pricing/core.js';

const root = new URL('../../services/ec2/components/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name + '.json', root), 'utf8'));

test('EC2 monitoring usage is metric-months scaled by instance count and usage hours', () => {
  const definition = read('detailed-monitoring');
  const context = { component: { metricsPerInstance: '7' }, resolvedInputs: { instance: { quantity: '2', hours: '365' } } };
  const dimension = { unit: 'Metrics', pricePerUnit: { USD: '0.30' } };
  const result = calculate(definition.calculation, context, dimension);
  assert.equal(result.billingQuantity, '7');
  assert.equal(result.amountUsd, '2.1');
});
test('EC2 outbound transfer quantity is priced through tiered dimensions, not a flat guessed rate', () => {
  const definition = read('transfer-internet-out');
  const context = { component: { gbPerMonth: '15' } };
  const dimensions = [
    { unit: 'GB', beginRange: '0', endRange: '10', pricePerUnit: { USD: '0.1' } },
    { unit: 'GB', beginRange: '10', endRange: 'Inf', pricePerUnit: { USD: '0.05' } }
  ];
  const result = calculate(definition.calculation, context, dimensions[0], dimensions);
  assert.equal(result.billingQuantity, '15');
  assert.equal(result.amountUsd, '1.25');
});

test('interregion transfer selects an exact route SKU and computes outbound GB only', () => {
  const definition = read('transfer-interregion');
  const tokyoOhio = 'APN1-USE2-AWS-Out-Bytes';
  assert.ok(definition.selectors[0].options.filters[1].value.includes(tokyoOhio));
  assert.equal(definition.selectors[0].options.label[tokyoOhio], '東京 → 米国東部（オハイオ）');
  assert.equal(definition.priceQuery.productFilters.at(-1).valueFrom, 'component.route');
  const result = calculate(definition.calculation, { component: { gbPerMonth: '75' } }, {
    unit: 'GB', pricePerUnit: { USD: '0.09' }
  });
  assert.equal(result.billingQuantity, '75');
  assert.equal(result.amountUsd, '6.75');
});

test('enabled EC2 monitoring with missing CloudWatch SKU fails closed rather than pricing zero', () => {
  const definition = read('detailed-monitoring');
  const pkg = {
    service: { id: 'ec2', priceSource: { serviceCode: 'AmazonEC2', componentOverrides: { 'detailed-monitoring': 'AmazonCloudWatch' } } },
    profiles: { standard: { selectors: [], fixedFilters: [], components: ['detailed-monitoring'] } },
    components: { 'detailed-monitoring': definition },
    pricingMappings: {}
  };
  const project = {};
  const instance = { serviceId: 'ec2', profileId: 'standard', selectors: {}, components: { 'detailed-monitoring': { enabled: true, inputs: { metricsPerInstance: '7' } } } };
  const evaluated = evaluateService(pkg, instance, project, [], [], { AmazonCloudWatch: [] });
  assert.equal(evaluated.state, 'invalid');
  assert.equal(evaluated.amountUsd, null);
  assert.ok(evaluated.issues.some(i => i.componentId === 'detailed-monitoring'));
  instance.components['detailed-monitoring'].enabled = false;
  const disabled = evaluateService(pkg, instance, project, [], [], { AmazonCloudWatch: [] });
  assert.equal(disabled.state, 'ready');
  assert.equal(disabled.amountUsd, '0');
});
