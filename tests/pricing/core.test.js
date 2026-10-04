import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePrice } from '../../src/pricing/price-query.js';
import { resolveDimension } from '../../src/pricing/dimensions.js';
import { calculate } from '../../src/pricing/calculation.js';
import { evaluateService, activeInputs } from '../../src/pricing/core.js';

export const dim = (beginRange = '0', endRange = 'Inf', price = '0.1', extra = {}) => ({ unit: 'Hrs', beginRange, endRange, pricePerUnit: { USD: price }, ...extra });
export const product = (dimensions = [dim()]) => ({ sku: 'fixture', productFamily: 'Compute', attributes: {}, terms: { onDemand: [{ priceDimensions: dimensions }] } });
export const query = { expect: 'singleSku', productFilters: [], dimensionFilters: [] };
export const calculation = { model: 'unit', usage: { sources: [{ valueFrom: 'component.hours' }, { valueFrom: 'component.count' }], combine: 'multiply' }, transforms: [], outputUnit: 'Hrs' };
const code = expected => error => error.issue?.code === expected;
test('strict 0/1/multiple SKU, current term and dimension cardinality', () => {
  assert.throws(() => resolvePrice([], query, {}), code('SKU_NOT_FOUND'));
  assert.throws(() => resolvePrice([product(), product()], query, {}), code('AMBIGUOUS_SKU'));
  assert.equal(resolvePrice([product()], query, {}).skuCount, 1);
  assert.throws(() => resolvePrice([product([])], query, {}), code('PRICE_DIMENSION_NOT_FOUND'));
  const p = product(); p.terms.onDemand.push(p.terms.onDemand[0]);
  assert.throws(() => resolvePrice([p], query, {}), code('AMBIGUOUS_ON_DEMAND_TERM'));
  assert.throws(() => resolvePrice([product()], { ...query, productFilters: [{ field: 'sku', op: 'eq', value: 'fixture' }] }, {}), code('INVALID_QUERY'));
  assert.throws(() => resolvePrice([product()], { ...query, dimensionFilters: [{ field: 'rateCode', op: 'exists' }] }, {}), code('INVALID_QUERY'));
});
test('allowance excluded only with evidence; tiers apply first paid rate to entire usage', () => {
  const free = dim('0', '10', '0', { freeAllowance: true, allowanceEvidence: 'AWS explicitly labels free allowance' });
  const result = resolveDimension([dim('100', 'Inf', '0.05'), free, dim('10', '100')]);
  assert.equal(result.dimension.beginRange, '10');
  assert.deepEqual(result.limitations.sort(), ['free-tier', 'tier-pricing']);
  assert.equal(calculate(calculation, { component: { hours: '200', count: '1' } }, result.dimension).amountUsd, '20');
  assert.equal(resolveDimension([dim('0', 'Inf', '0')]).dimension.pricePerUnit.USD, '0');
  assert.throws(() => resolveDimension([free, dim('0', 'Inf', '0', { freeAllowance: true })]), code('INVALID_FREE_ALLOWANCE'));
  assert.throws(() => resolveDimension([dim(), dim()]), code('AMBIGUOUS_PRICE_DIMENSION'));
  assert.throws(() => resolveDimension([dim('0', '100'), dim('100', 'Inf', '1', { unit: 'GB' })]), code('AMBIGUOUS_PRICE_DIMENSION'));
});
test('ordered transforms, units, decimal precision and missing usage', () => {
  const c = { ...calculation, transforms: [{ type: 'minimum', value: '2.1' }, { type: 'increment', value: '2' }, { type: 'scale', factor: '0.1' }, { type: 'rounding', mode: 'ceil' }, { type: 'unitConversion', factor: '0.001', from: 'ms', to: 'Hrs' }] };
  assert.equal(calculate(c, { component: { hours: '0.1', count: '1' } }, dim()).billingQuantity, '0.001');
  assert.equal(calculate(calculation, { component: { hours: '0.1', count: '0.2' } }, dim()).amountUsd, '0.002');
  const requestCalculation = { model: 'unit', usage: { sources: [{ valueFrom: 'component.requests' }], combine: 'multiply' }, transforms: [], outputUnit: 'Request' };
  assert.equal(calculate(requestCalculation, { component: { requests: '1000' } }, dim('0', 'Inf', '0.000001', { unit: 'Requests' })).amountUsd, '0.001');
  assert.throws(() => calculate(calculation, { component: {} }, dim()), code('MISSING_USAGE'));
  assert.throws(() => calculate(calculation, { component: { hours: '-1', count: '1' } }, dim()), code('INVALID_USAGE'));
  assert.throws(() => calculate(calculation, { component: { hours: '1', count: '1' } }, dim('0', 'Inf', '1', { unit: 'GB' })), code('UNIT_MISMATCH'));
});
test('disabled inputs and components stay out of calculation context', () => {
  const pkg = { profiles: { standard: { selectors: [], fixedFilters: [], components: ['instance'] } }, components: { instance: { selectors: [], usageInputs: [{ id: 'hours', label: 'Hours', type: 'number' }, { id: 'count', label: 'Count', type: 'number', enabledWhen: { field: 'profile.x', op: 'exists' } }], fixedFilters: [], priceQuery: query, calculation, limitations: [] } } };
  const instance = { profileId: 'standard', selectors: {}, components: { instance: { inputs: { hours: '1', count: '99' } } } };
  assert.equal(evaluateService(pkg, instance, {}, [product()]).issues[0].code, 'MISSING_USAGE');
  pkg.components.instance.optional = true; instance.components.instance.enabled = false;
  assert.equal(evaluateService(pkg, instance, {}, []).amountUsd, '0');
});
test('active input DAG evaluates parents first and excludes disabled saved values from child conditions', () => {
  const inputs = [{ id: 'child', label: 'Child', type: 'number', enabledWhen: { field: 'component.parent', op: 'exists' } }, { id: 'parent', label: 'Parent', type: 'number', enabledWhen: { field: 'profile.toggle', op: 'eq', value: true } }];
  const saved = { parent: '5', child: '10' }, context = { profile: { toggle: false }, component: saved };
  assert.deepEqual(activeInputs(inputs, saved, context, [], []), {});
  context.profile.toggle = true; assert.deepEqual(activeInputs(inputs, saved, context, [], []), { parent: '5', child: '10' });
  assert.deepEqual(saved, { parent: '5', child: '10' });
});
test('missing saved inputs use definition defaults without mutating saved state', () => {
  const inputs = [
    { id: 'addedLater', label: 'Added later', type: 'number', default: '42', minimum: '0' },
    { id: 'stillRequired', label: 'Still required', type: 'number' }
  ];
  const saved = { stillRequired: '7' };
  const context = { profile: {}, component: saved };
  assert.deepEqual(activeInputs(inputs, saved, context, [], []), { addedLater: '42', stillRequired: '7' });
  assert.deepEqual(saved, { stillRequired: '7' });
  assert.throws(() => activeInputs([{ id: 'required', label: 'Required', type: 'number' }], {}, { profile: {}, component: {} }, [], []), code('MISSING_INPUT'));
});
