import test from 'node:test';
import assert from 'node:assert/strict';
import { reachableCaseIterator } from '../../tools/pricing-cli/semantics.js';

const selectors = [
  { id: 'a', type: 'select', default: '0', options: { values: Array.from({ length: 20 }, (_, i) => String(i)) } },
  { id: 'b', type: 'select', default: '0', options: { values: Array.from({ length: 20 }, (_, i) => String(i)) } },
  { id: 'c', type: 'select', default: '0', options: { values: Array.from({ length: 20 }, (_, i) => String(i)) } }
];
const pkg = {
  service: { id: 'range-test', defaultProfile: 'default', profiles: ['default'], priceSource: { serviceCode: 'RangeTest' } },
  profiles: { default: { selectors: [], fixedFilters: [], components: ['meter'] } },
  components: { meter: { selectors, usageInputs: [], defaultEnabled: true, fixedFilters: [], priceQuery: { productFilters: [] } } },
  pricingMappings: {}
};
const products = { RangeTest: [] };
function cases(options = {}) {
  const stats = {};
  const samples = [...reachableCaseIterator(pkg, products, 'ap-northeast-1', { ...options, stats })]
    .map(sample => sample.instance.components.meter.inputs);
  return { samples, stats };
}
test('ranged selector traversal preserves exact full enumeration order', () => {
  const full = cases().samples;
  assert.equal(full.length, 8000);
  for (const [offset, limit] of [[0, 20], [37, 125], [3899, 91], [7990, 10], [8000, 10]]) {
    assert.deepEqual(cases({ caseOffset: offset, caseLimit: limit }).samples, full.slice(offset, offset + limit));
  }
});
test('late range prunes entire subtrees rather than allocating preceding leaves', () => {
  const { samples, stats } = cases({ caseOffset: 7900, caseLimit: 5 });
  assert.equal(samples.length, 5);
  assert.equal(stats.skipped, 7900);
  assert.equal(stats.yielded, 5);
  assert.ok(stats.prunedBranches >= 7800);
});
