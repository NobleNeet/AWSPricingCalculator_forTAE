import test from 'node:test';
import assert from 'node:assert/strict';
import { instanceRows, matchesColumn, filterRows } from '../../src/app/ec2-instance-model.js';

const product = (instanceType, { os = 'Linux', tenancy = 'Shared', software = 'NA', vcpu = '4', memory = '16 GiB', hourly = '0.25', family = 'General purpose', current = 'Yes' } = {}) => ({
  attributes: { instanceType, operatingSystem: os, tenancy, preInstalledSw: software, capacitystatus: 'Used', marketoption: 'OnDemand', operation: 'RunInstances', vcpu, memory, instanceFamily: family, networkPerformance: 'Up to 12.5 Gigabit', storage: 'EBS only', currentGeneration: current },
  terms: { onDemand: [{ priceDimensions: [{ unit: 'Hrs', pricePerUnit: { USD: hourly } }] }] }
});

test('instanceRows creates one comparable row per EC2 instance type and does not choose a cheapest ambiguous rate', () => {
  const rows = instanceRows([product('m7i.large'), product('m7i.large', { hourly: '0.30' }), product('t3.micro', { vcpu: '2', memory: '1 GiB', hourly: '0.0136' }), product('m7i.large', { os: 'Windows' })], 'Linux');
  assert.deepEqual(rows.map(row => row.instanceType), ['m7i.large', 't3.micro']);
  assert.equal(rows[0].family, 'm7i');
  assert.equal(rows[0].vcpu, 4);
  assert.equal(rows[0].memory, 16);
  assert.equal(rows[0].hourly, null);
});

test('instanceRows follows the selected tenancy', () => {
  const rows = instanceRows([product('m7i.large'), product('m7i.large', { tenancy: 'Dedicated', hourly: '0.50' })], 'Linux', 'Dedicated');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].instanceType, 'm7i.large');
  assert.equal(rows[0].hourly, 0.50);
});

test('instanceRows follows the selected pre-installed software', () => {
  const rows = instanceRows([
    product('m7i.large', { os: 'Windows', software: 'NA', hourly: '0.50' }),
    product('m7i.large', { os: 'Windows', software: 'SQL Std', hourly: '1.25' }),
    product('m7i.xlarge', { os: 'Windows', software: 'SQL Web', hourly: '0.80' })
  ], 'Windows', 'Shared', 'SQL Std');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].instanceType, 'm7i.large');
  assert.equal(rows[0].hourly, 1.25);
});

test('numeric column filters support comparison operators', () => {
  assert.equal(matchesColumn(8, '>=4', 'number'), true);
  assert.equal(matchesColumn(8, '<8', 'number'), false);
  assert.equal(matchesColumn(0.25, '<=0.5', 'number'), true);
  assert.equal(matchesColumn(4, '4', 'number'), true);
});

test('filters are combined with AND semantics and text is incremental partial match', () => {
  const rows = instanceRows([product('m7i.large'), product('t3.micro', { vcpu: '2', memory: '1 GiB', hourly: '0.0136', family: 'Burstable performance' })], 'Linux');
  const filtered = filterRows(rows, { family: 'm7', category: 'general', vcpu: '>=4', memory: '>=16', hourly: '<=0.5' });
  assert.deepEqual(filtered.map(row => row.instanceType), ['m7i.large']);
});
