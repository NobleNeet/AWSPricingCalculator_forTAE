import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate } from '../../src/pricing/calculation.js';
import { evaluateService } from '../../src/pricing/core.js';
import { reachableCaseIterator } from '../../tools/pricing-cli/semantics.js';

const root = new URL('../../services/ec2/components/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name + '.json', root), 'utf8'));

test('EC2 monitoring usage is metric-months scaled by instance count and usage hours', () => {
  const definition = read('detailed-monitoring');
  const context = { component: { metricsPerInstance: '7' }, resolvedInputs: { instance: { quantity: '2', hours: '365' } } };
  const dimensions = [
    { unit: 'Metrics', beginRange: '0', endRange: '10000', pricePerUnit: { USD: '0.30' } },
    { unit: 'Metrics', beginRange: '10000', endRange: '250000', pricePerUnit: { USD: '0.10' } },
    { unit: 'Metrics', beginRange: '250000', endRange: '1000000', pricePerUnit: { USD: '0.05' } },
    { unit: 'Metrics', beginRange: '1000000', endRange: 'Inf', pricePerUnit: { USD: '0.02' } }
  ];
  const result = calculate(definition.calculation, context, dimensions[0], dimensions);
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

test('semantic case retains prerequisite instance inputs for detailed monitoring', () => {
  const monitoring = read('detailed-monitoring');
  const instanceDefinition = {
    id: 'instance', selectors: [], usageInputs: [
      { id: 'quantity', type: 'number', default: '2', minimum: '1' },
      { id: 'hours', type: 'number', default: '730', minimum: '0' }
    ],
    fixedFilters: [], priceQuery: { productFilters: [] }, calculation: { model: 'unit', usage: { sources: [{ valueFrom: 'component.hours' }], combine: 'multiply' } }, limitations: []
  };
  const pkg = {
    service: { id: 'ec2', profiles: ['standard'], defaultProfile: 'standard', priceSource: { serviceCode: 'AmazonEC2', componentOverrides: { 'detailed-monitoring': 'AmazonCloudWatch' } } },
    profiles: { standard: { selectors: [], fixedFilters: [], components: ['instance', 'detailed-monitoring'] } },
    components: { instance: instanceDefinition, 'detailed-monitoring': monitoring },
    pricingMappings: {}
  };
  const cases = [...reachableCaseIterator(pkg, { AmazonEC2: [], AmazonCloudWatch: [] })];
  const metered = cases.find(entry => entry.componentId === 'detailed-monitoring');
  assert.ok(metered);
  assert.deepEqual(metered.pkg.profiles.standard.components, ['instance', 'detailed-monitoring']);
  assert.equal(metered.instance.components.instance.inputs.quantity, '2');
  assert.equal(metered.instance.components.instance.inputs.hours, '730');
});

test('semantic monitoring prerequisite chooses an instance type available in each profile branch', () => {
  const monitoring = read('detailed-monitoring');
  const instanceDefinition = {
    id: 'instance', selectors: [{
      id: 'instanceType', type: 'select', default: 't3.micro',
      options: { attribute: 'instanceType', filters: [{ field: 'attributes.operatingSystem', op: 'eq', valueFrom: 'profile.os' }] }
    }], usageInputs: [
      { id: 'quantity', type: 'number', default: '1', minimum: '1' },
      { id: 'hours', type: 'number', default: '730', minimum: '0' }
    ], fixedFilters: [{ field: 'productFamily', op: 'eq', value: 'Compute Instance' }],
    priceQuery: { productFilters: [] }, calculation: { model: 'unit', usage: { sources: [{ valueFrom: 'component.hours' }], combine: 'multiply' } }, limitations: []
  };
  const pkg = {
    service: { id: 'ec2', profiles: ['standard'], defaultProfile: 'standard', priceSource: { serviceCode: 'AmazonEC2', componentOverrides: { 'detailed-monitoring': 'AmazonCloudWatch' } } },
    profiles: { standard: { selectors: [{ id: 'os', type: 'select', default: 'Linux', options: { values: ['Linux', 'Windows'] } }], fixedFilters: [], components: ['instance', 'detailed-monitoring'] } },
    components: { instance: instanceDefinition, 'detailed-monitoring': monitoring }, pricingMappings: {}
  };
  const products = [
    { sku: 'linux', productFamily: 'Compute Instance', attributes: { instanceType: 't3.micro', operatingSystem: 'Linux' } },
    { sku: 'windows', productFamily: 'Compute Instance', attributes: { instanceType: 'm5.large', operatingSystem: 'Windows' } }
  ];
  const cases = [...reachableCaseIterator(pkg, { AmazonEC2: products, AmazonCloudWatch: [] })].filter(entry => entry.componentId === 'detailed-monitoring');
  assert.equal(cases.length, 2);
  assert.deepEqual(cases.map(entry => [entry.instance.selectors.os, entry.instance.components.instance.inputs.instanceType]), [
    ['Linux', 't3.micro'], ['Windows', 'm5.large']
  ]);
});
