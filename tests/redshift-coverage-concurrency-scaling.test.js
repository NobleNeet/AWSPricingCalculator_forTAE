import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const coverage = JSON.parse(readFileSync(new URL('../services/redshift/coverage.json', import.meta.url), 'utf8'));
const types = ['dc2.8xlarge','dc2.large','ds2.8xlarge','ds2.xlarge','ra3.16xlarge','ra3.4xlarge','ra3.large','ra3.xlplus','rg.12xlarge','rg.4xlarge','rg.large','rg.xlarge'];
const matched = type => coverage.categories.filter(c => c.filters.some(f => f.field === 'productFamily' && f.value === 'Redshift Concurrency Scaling') && c.filters.some(f => f.field === 'usageTypeClass' && f.value === type));
test('Redshift Concurrency Scaling published Tokyo category classes have exactly one explicit classification', () => {
  for (const prefix of ['CS','CSFreeUsage']) for (const t of types) {
    const matches = matched(prefix + ':' + t);
    assert.equal(matches.length, 1, prefix + ':' + t);
    assert.equal(matches[0].status,'ignored');
    assert.ok(matches[0].reason?.length > 15);
  }
});
