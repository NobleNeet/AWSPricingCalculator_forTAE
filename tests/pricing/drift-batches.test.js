import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { groupDriftTasks } from '../../tools/drift-batch-plan.js';
import { mergeDriftBatches } from '../../tools/merge-drift-batches.js';
import { driftTasks } from '../../tools/pricing-cli/drift-parallel.js';
import { sourceScopedPackage } from '../../tools/pricing-cli/drift-task.js';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value)}\n`);
}

test('drift task grouping shards large reachable-case sets', () => {
  const tasks = [
    { taskId: 0, serviceCode: 'AmazonEC2', region: 'us-east-1', caseCount: 61000 },
    { taskId: 1, serviceCode: 'AmazonRDS', region: 'ap-northeast-1', caseCount: 600 },
    { taskId: 2, serviceCode: 'Auxiliary', region: 'ap-northeast-1', caseCount: 0 }
  ];
  const grouped = groupDriftTasks(tasks, 25000, 240);

  assert.equal(grouped.batchCases, 25000);
  assert.equal(grouped.batches.length, 5);
  assert.deepEqual(
    grouped.batches.filter(batch => batch.task_id === 0).map(batch => [
      batch.case_offset,
      batch.planned_cases,
      batch.include_structural
    ]),
    [
      [0, 25000, true],
      [25000, 25000, false],
      [50000, 11000, false]
    ]
  );
  assert.equal(grouped.batches.find(batch => batch.task_id === 2).planned_cases, 0);
});

test('drift task grouping expands shard size before exceeding matrix limit', () => {
  const tasks = [
    { taskId: 0, serviceCode: 'AmazonEC2', region: 'us-east-1', caseCount: 1000000 }
  ];
  const grouped = groupDriftTasks(tasks, 1000, 10);
  assert.equal(grouped.batchCases, 100000);
  assert.equal(grouped.batches.length, 10);
});

test('drift source scoping keeps only components billed by the current AWS price source', () => {
  const pkg = {
    service: { priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
    profiles: { limitless: { components: ['compute', 'database-insights-limitless'] } },
    components: { compute: {}, 'database-insights-limitless': {} },
    pricingMappings: {
      insights: {
        id: 'insights',
        componentId: 'database-insights-limitless',
        priceSource: { serviceCode: 'AmazonCloudWatch' }
      }
    }
  };

  assert.deepEqual(sourceScopedPackage(pkg, 'AmazonRDS').profiles.limitless.components, ['compute']);
  assert.deepEqual(sourceScopedPackage(pkg, 'AmazonCloudWatch').profiles.limitless.components, ['database-insights-limitless']);
});

test('drift tasks include AWS price sources introduced only by pricing mappings', () => {
  const packages = [{
    service: { priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
    pricingMappings: {
      insights: { priceSource: { serviceCode: 'AmazonCloudWatch' } }
    }
  }];
  const candidate = {
    'AmazonRDS/ap-northeast-1': { serviceCode: 'AmazonRDS', region: 'ap-northeast-1' },
    'AmazonCloudWatch/ap-northeast-1': { serviceCode: 'AmazonCloudWatch', region: 'ap-northeast-1' }
  };
  const planned = driftTasks(packages, {}, candidate, {});
  assert.equal(planned.missingService, false);
  assert.deepEqual(planned.tasks.map(task => task.serviceCode).sort(), ['AmazonCloudWatch', 'AmazonRDS']);
});

test('drift batch merge accepts multiple case shards for one task and requires every planned shard', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'drift-batches-'));
  try {
    const planFile = path.join(root, 'plan.json');
    const batchesDir = path.join(root, 'batches');
    const plan = {
      missingService: false,
      summary: { totalCases: 30000, casesPerBatch: 20000 },
      tasks: [
        { taskId: 0, serviceCode: 'A', region: 'r1', caseCount: 30000 },
        { taskId: 1, serviceCode: 'B', region: 'r1', caseCount: 0 }
      ],
      matrix: {
        include: [
          { batch_id: '0000', task_id: 0, task_ids: [0], case_offset: 0, case_limit: 20000 },
          { batch_id: '0001', task_id: 0, task_ids: [0], case_offset: 20000, case_limit: 10000 },
          { batch_id: '0002', task_id: 1, task_ids: [1], case_offset: 0, case_limit: 1 }
        ]
      }
    };
    await writeJson(planFile, plan);
    await writeJson(path.join(batchesDir, 'batch-0000.json'), {
      batchId: '0000', taskId: 0, taskIds: [0], caseOffset: 0, caseLimit: 20000,
      processedCases: 20000, issues: [], warning: false, classification: 'PRICE_ONLY',
      rateDiff: [{ sku: 'a' }], taskTimings: [{ taskId: 0, caseOffset: 0, elapsedMs: 10 }]
    });
    await writeJson(path.join(batchesDir, 'batch-0001.json'), {
      batchId: '0001', taskId: 0, taskIds: [0], caseOffset: 20000, caseLimit: 10000,
      processedCases: 10000, issues: [], warning: false, classification: 'PRICE_ONLY',
      rateDiff: [], taskTimings: [{ taskId: 0, caseOffset: 20000, elapsedMs: 20 }]
    });
    await writeJson(path.join(batchesDir, 'batch-0002.json'), {
      batchId: '0002', taskId: 1, taskIds: [1], caseOffset: 0, caseLimit: 1,
      processedCases: 0, issues: [], warning: true, classification: 'STRUCTURE_WARNING',
      rateDiff: [], taskTimings: [{ taskId: 1, caseOffset: 0, elapsedMs: 5 }]
    });

    const merged = await mergeDriftBatches(planFile, batchesDir);
    assert.equal(merged.status, 'passed');
    assert.equal(merged.classification, 'STRUCTURE_WARNING');
    assert.equal(merged.publishable, true);
    assert.equal(merged.batches, 3);
    assert.equal(merged.processedCases, 30000);
    assert.equal(merged.rateDiff.length, 1);

    await rm(path.join(batchesDir, 'batch-0001.json'));
    await assert.rejects(() => mergeDriftBatches(planFile, batchesDir), /Missing drift batches/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
