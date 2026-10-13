import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateService } from '../../src/pricing/core.js';
import { dim, product, query, calculation } from './core.test.js';

const pkg = {
  service: { id: 'ec2', priceSource: { serviceCode: 'AmazonEC2' } },
  profiles: { standard: { selectors: [], fixedFilters: [], components: ['instance'] } },
  components: {
    instance: { selectors: [], usageInputs: [
      { id: 'hours', type: 'number', default: '10', minimum: '0' },
      { id: 'count', type: 'number', default: '1', minimum: '0' }
    ], fixedFilters: [], priceQuery: query, calculation, limitations: [] }
  }
};
const instance = amount => ({
  serviceId: 'ec2', profileId: 'standard', selectors: {},
  components: { instance: { enabled: true, inputs: { hours: '10', count: '1' } } },
  ...(amount === undefined ? {} : { additionalMonthlyCostUsd: amount })
});
const run = amount => evaluateService(pkg, instance(amount), {}, [product([dim('0', 'Inf', '0.1')])]);

test('custom monthly costs are added once with no fabricated SKU', () => {
  assert.equal(run(undefined).amountUsd, '1');
  const result = run('2.75');
  assert.equal(result.amountUsd, '3.75');
  assert.equal(result.components['additional-costs'].amountUsd, '2.75');
  assert.equal(result.components['additional-costs'].source, 'user-supplied');
  assert.equal(result.components.instance.amountUsd, '1');
  assert.equal(run('0').amountUsd, '1');
});
test('invalid user cost invalidates the estimate rather than silently changing totals', () => {
  for (const cost of ['-1', 'abc', '1e8', '', '1,000']) {
    const result = run(cost);
    assert.equal(result.state, 'invalid', cost);
    assert.equal(result.amountUsd, null, cost);
    assert.ok(result.issues.some(issue => issue.code === 'INVALID_INPUT'), cost);
  }
});
