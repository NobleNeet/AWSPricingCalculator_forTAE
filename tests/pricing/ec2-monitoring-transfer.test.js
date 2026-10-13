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
