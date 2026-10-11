import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../../src/pricing/calculation.js';

const pricing = { model: 'unit', usage: {
  combine: 'multiply', sources: [
    { value: { type: 'resolvedComponentAttribute', componentId: 'instance', attribute: 'vcpu' } },
    { value: { type: 'transformed', valueFrom: 'profile.utilizationPct', transforms: [{ type: 'scale', factor: '7.3' }] } },
    { valueFrom: 'profile.nodes' }
  ]
}, transforms: [], outputUnit: 'vCPU-Hours' };
const dimension = { unit: 'vCPU-Hours', pricePerUnit: { USD: '0.0125' } };

test('Database Insights uses the selected DB instance vCPU automatically', () => {
  const context = { profile: { utilizationPct: '100', nodes: '1' }, resolvedComponents: { instance: { attributes: { vcpu: '8' } } } };
  const result = calculate(pricing, context, dimension);
  assert.equal(result.billingQuantity, '5840');
  assert.equal(result.amountUsd, '73');
  const scaled = calculate(pricing, { ...context, profile: { utilizationPct: '50', nodes: '3' } }, dimension);
  assert.equal(scaled.billingQuantity, '8760');
  assert.equal(scaled.amountUsd, '109.5');
});

test('Resolved component attribute must be available and numeric, never guessed', () => {
  assert.throws(() => calculate(pricing, { profile: { utilizationPct: '100', nodes: '1' }, resolvedComponents: {} }, dimension), /Missing resolved/);
  assert.throws(() => calculate(pricing, { profile: { utilizationPct: '100', nodes: '1' }, resolvedComponents: { instance: { attributes: { vcpu: 'unknown' } } } }, dimension), /Invalid numeric/);
});
