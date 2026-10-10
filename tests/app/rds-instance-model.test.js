import test from 'node:test';
import assert from 'node:assert/strict';
import { rdsInstanceRows, matchesRdsColumn, filterRdsRows } from '../../src/app/rds-instance-model.js';

function product(instanceType, price, overrides = {}) {
  const attributes = {
    databaseEngine: 'PostgreSQL',
    deploymentOption: 'Single-AZ',
    licenseModel: 'No license required',
    instanceType,
    instanceTypeFamily: 'T4G',
    instanceFamily: 'General purpose',
    vcpu: '2',
    memory: '1 GiB',
    networkPerformance: 'Up to 5 Gigabit',
    dedicatedEbsThroughput: 'Up to 2085 Mbps',
    currentGeneration: 'Yes',
    ...overrides
  };
  return {
    productFamily: 'Database Instance',
    attributes,
    terms: { onDemand: [{ priceDimensions: [{ unit: 'Hrs', pricePerUnit: { USD: String(price) } }] }] }
  };
}

test('rdsInstanceRows returns only PostgreSQL DB instance classes for selected deployment', () => {
  const rows = rdsInstanceRows([
    product('db.t4g.micro', 0.03),
    product('db.t4g.small', 0.06, { memory: '2 GiB' }),
    product('db.t4g.micro', 0.07, { deploymentOption: 'Multi-AZ' }),
    product('db.t4g.micro', 0.08, { databaseEngine: 'MySQL' }),
    { ...product('m7g.large', 0.1), attributes: { ...product('m7g.large', 0.1).attributes, instanceType: 'm7g.large' } }
  ]);
  assert.deepEqual(rows.map(row => row.instanceType), ['db.t4g.micro', 'db.t4g.small']);
  assert.equal(rows[0].vcpu, 2);
  assert.equal(rows[0].memory, 1);
  assert.equal(rows[0].hourly, 0.03);
});

test('numeric RDS filters support comparison operators', () => {
  assert.equal(matchesRdsColumn(8, '>=4', 'number'), true);
  assert.equal(matchesRdsColumn(8, '<8', 'number'), false);
  assert.equal(matchesRdsColumn(8, '=8', 'number'), true);
});

test('RDS filters combine with AND semantics and text partial match', () => {
  const rows = [
    { instanceType: 'db.m7g.large', typeFamily: 'M7G', category: 'General purpose', vcpu: 2, memory: 8, network: 'Up to 12.5 Gigabit', ebsThroughput: 'Up to 5000 Mbps', currentGeneration: 'Yes', hourly: 0.2 },
    { instanceType: 'db.r7g.large', typeFamily: 'R7G', category: 'Memory optimized', vcpu: 2, memory: 16, network: 'Up to 12.5 Gigabit', ebsThroughput: 'Up to 5000 Mbps', currentGeneration: 'Yes', hourly: 0.3 }
  ];
  const filtered = filterRdsRows(rows, { instanceType: 'r7g', memory: '>=16' });
  assert.deepEqual(filtered.map(row => row.instanceType), ['db.r7g.large']);
});

test('Oracle instance comparison excludes PostgreSQL, RDS Custom and mismatched licensing or editions', () => {
  const oracle = (type, cost, extra = {}) => product(type, cost, {
    databaseEngine: 'Oracle',
    deploymentOption: 'Multi-AZ',
    licenseModel: 'Bring your own license',
    databaseEdition: 'Enterprise',
    ...extra
  });
  const rows = rdsInstanceRows([
    oracle('db.m6i.2xlarge', 1.2),
    oracle('db.r6i.2xlarge', 1.8, { memory: '64 GiB', vcpu: '8' }),
    oracle('db.m6i.2xlarge', 2.2, { deploymentModel: 'RDS Custom' }),
    oracle('db.m6i.large', 0.5, { licenseModel: 'License included' }),
    oracle('db.m6i.xlarge', 0.8, { databaseEdition: 'Standard Edition 2' }),
    product('db.t4g.micro', 0.03)
  ], {
    databaseEngine: 'Oracle',
    deployment: 'Multi-AZ',
    licenseModel: 'Bring your own license',
    databaseEdition: 'Enterprise'
  });
  assert.deepEqual(rows.map(row => row.instanceType), ['db.m6i.2xlarge', 'db.r6i.2xlarge']);
  assert.deepEqual(filterRdsRows(rows, { memory: '>=64', vcpu: '>=8' }).map(row => row.instanceType), ['db.r6i.2xlarge']);
});
