import test from 'node:test';
import assert from 'node:assert/strict';
import { decimal, money, sum } from '../../src/pricing/decimal.js';
import { matches, resolveValue } from '../../src/pricing/filter.js';
import { enabled } from '../../src/pricing/conditions.js';

test('decimal arithmetic preserves prices and final display rounding', () => {
  assert.equal(decimal('0.1').times('0.2').toString(), '0.02');
  assert.equal(sum(['0.1', '0.2']).toString(), '0.3');
  assert.equal(decimal('1.000000000000000001').gt('1'), true);
  assert.equal(money('0.001'), '< $0.01');
  assert.equal(money('0'), '$0.00');
  assert.throws(() => decimal('Infinity'));
});
test('strict filters, static membership, missing values', () => {
  for (const op of ['eq', 'neq', 'in', 'notIn']) assert.equal(matches({}, [{ field: 'x', op, value: op.includes('In') || op === 'in' ? ['A'] : 'A' }]), false);
  assert.equal(matches({ x: 1 }, [{ field: 'x', op: 'eq', value: '1' }]), false);
  assert.equal(matches({ x: 'a' }, [{ field: 'x', op: 'eq', value: 'A' }]), false);
  assert.equal(matches({ x: null }, [{ field: 'x', op: 'exists' }]), true);
  assert.equal(matches({}, [{ field: 'x', op: 'notExists' }]), true);
  assert.equal(matches({ x: 'A' }, [{ field: 'x', op: 'in', value: ['A'] }]), true);
  assert.throws(() => matches({}, [{ field: 'x', op: 'regex', value: '.' }]));
  assert.throws(() => resolveValue({ value: 1, valueFrom: 'profile.x' }, {}));
  assert.throws(() => resolveValue({ valueFrom: 'profile.x.y' }, {}));
});
test('nested conditions with missing and strict context fields', () => {
  const leaf = { field: 'profile.engine', op: 'eq', value: 'mysql' };
  assert.equal(enabled({ all: [leaf, { not: { field: 'component.x', op: 'exists' } }] }, { profile: { engine: 'mysql' }, component: {} }), true);
  assert.equal(enabled({ any: [leaf] }, { profile: { engine: 'MYSQL' } }), false);
  assert.equal(enabled({ field: 'component.x', op: 'neq', value: 1 }, { component: {} }), false);
  assert.throws(() => enabled({ all: [], any: [] }, {}));
});
