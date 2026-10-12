import test from 'node:test';
import assert from 'node:assert/strict';
import { REDSHIFT_INSTANCE_COLUMNS, redshiftInstanceRows, filterRedshiftRows } from '../src/app/redshift-instance-model.js';

const product = (type, rate, extras = {}) => ({
  productFamily: 'Compute Instance',
  attributes: { instanceType: type, operation: 'RunComputeNode:0001', usageFamily: type.startsWith('ra3') ? 'RA3' : 'Dense Compute', vcpu: '32', memory: '244 GiB', storage: '2.56TB SSD', io: '7.50 GB/s', currentGeneration: 'Yes', ...extras },
  terms: { onDemand: [{ priceDimensions: [{ unit: 'Hrs', pricePerUnit: { USD: rate } }] }] }
});

test('Redshift instance comparison builds columns from eligible regional AWS product prices', () => {
  const rows = redshiftInstanceRows([
    product('dc2.8xlarge','6.095'),
    product('ra3.large','0.639',{vcpu:'2',memory:'16 GiB'}),
    product('dc2.large','0.314'),
    product('unused.large','0.010'),
    { ...product('dc2.large','9.999'), productFamily:'Storage Snapshot' }
  ], ['dc2.8xlarge','ra3.large','dc2.large']);
  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => row.instanceType === 'dc2.8xlarge').hourly, 6.095);
  assert.equal(rows.find(row => row.instanceType === 'ra3.large').memory, 16);
  assert.deepEqual(REDSHIFT_INSTANCE_COLUMNS.map(column => column[0]), ['instanceType','family','vcpu','memory','storage','io','currentGeneration','hourly']);
  assert.deepEqual(filterRedshiftRows(rows, { vcpu: '>=32', hourly: '<1' }).map(row => row.instanceType), ['dc2.large']);
  assert.deepEqual(filterRedshiftRows(rows, { family: 'ra3' }).map(row => row.instanceType), ['ra3.large']);
});

test('Ambiguous AWS compute pricing must not be represented as a valid rate', () => {
  const rows = redshiftInstanceRows([product('dc2.large','0.31'),product('dc2.large','0.44')],['dc2.large']);
  assert.equal(rows[0].hourly,null);
});
