import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCoverage } from '../../tools/pricing-cli/inventory.js';

const loadCoverage = async service => JSON.parse(await readFile(
  new URL(`../../services/${service}/coverage.json`, import.meta.url), 'utf8'
));

const cases = [
  {
    services: ['ec2', 'ebs'],
    category: {
      productFamily: 'CPU Credits',
      operation: 'T9GCPUCredits',
      usageTypeClass: 'CPUCredits',
      unit: 'vCPU-Hours',
      discriminators: { operatingSystem: 'Linux' }
    }
  },
  {
    services: ['elastic-load-balancing'],
    category: {
      productFamily: 'Load Balancer-Network',
      operation: 'LoadBalancing:Network',
      usageTypeClass: 'TS-LoadBalancerUsage',
      unit: 'Hrs',
      discriminators: {}
    }
  },
  {
    services: ['eventbridge'],
    category: {
      productFamily: 'EventBridge',
      operation: '',
      usageTypeClass: 'EventsV2-MSKTargetCompression-64K-ChunkSize',
      unit: 'Operations',
      discriminators: {}
    }
  }
];

test('2026-11-21 AWS Price List drift categories are explicitly ignored exactly once', async () => {
  for (const { services, category } of cases) for (const service of services) {
    const result = validateCoverage([{
      ...category,
      shapeSignatures: [JSON.stringify([{ unit: category.unit, allowance: false }])]
    }], await loadCoverage(service));
    assert.deepEqual(result.issues, [], `${service}: ${category.usageTypeClass}`);
    assert.equal(result.summary.ignored, 1, service);
    assert.equal(result.summary.mapped, 0, service);
  }
});

test('unrecognized future price-list categories still fail closed', async () => {
  for (const { services, category } of cases) for (const service of services) {
    const result = validateCoverage([{
      ...category,
      usageTypeClass: `${category.usageTypeClass}-UNKNOWN-FUTURE-METER`,
      shapeSignatures: [JSON.stringify([{ unit: category.unit, allowance: false }])]
    }], await loadCoverage(service));
    assert.equal(result.summary.unresolved, 1, service);
    assert.equal(result.issues[0]?.code, 'UNMAPPED_PRICING_CATEGORY', service);
  }
});
