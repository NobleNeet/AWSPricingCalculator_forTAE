import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUsageSource, calculate } from '../../src/pricing/calculation.js';

test('ELB capacity maximum chooses the largest normalized dimension with exact decimals', () => {
  const expression = { value: { type: 'maximum', sources: [
    { valueFrom: 'component.newConnections' },
    { value: { type: 'transformed', valueFrom: 'component.bytesPerHour', transforms: [{ type: 'divide', divisor: '1000' }] } },
    { valueFrom: 'component.activeConnections' }
  ] } };
  const context = { component: { newConnections: '2.000000000000000001', bytesPerHour: '2000', activeConnections: '1.5' } };
  assert.equal(resolveUsageSource(expression, context).toString(), '2.000000000000000001');
  const calc = { model: 'unit', usage: { combine: 'multiply', sources: [expression, { valueFrom: 'project.hoursPerMonth' }] }, transforms: [], outputUnit: 'LCU-Hrs' };
  const price = { unit: 'LCU-Hrs', pricePerUnit: { USD: '0.008' } };
  assert.equal(calculate(calc, { ...context, project: { hoursPerMonth: '730' } }, price).billingQuantity, '1460.00000000000000073');
});

test('maximum expression rejects empty dimensions and propagates missing input failures', () => {
  assert.throws(() => resolveUsageSource({ value: { type: 'maximum', sources: [] } }, {}), /Maximum usage expression/);
  assert.throws(() => resolveUsageSource({ value: { type: 'maximum', sources: [{ valueFrom: 'component.missing' }] } }, { component: {} }), /Missing/);
});
