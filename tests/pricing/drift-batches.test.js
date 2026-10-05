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

test('drift task grouping keeps batches bounded by matrix limit', () => {
  const tasks = Array.from({ length: 11 }, (_, taskId) => ({ taskId, serviceCode: 'Example', region: `r${taskId}` }));
  const grouped = groupDriftTasks(tasks, 1, 4);
  assert.equal(grouped.batchTasks, 3);
  assert.equal(grouped.batches.length, 4);
  assert.deepEqual(grouped.batches.map(batch => batch.task_ids), [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10]]);
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

test('drift batch merge requires every planned task exactly once', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'drift-batches-'));
  try {
    const planFile = path.join(root, 'plan.json');
    const batchesDir = path.join(root, 'batches');
    const plan = {
      missingService: false,
      tasks: [
        { taskId: 0, serviceCode: 'A', region: 'r1' },
        { taskId: 1, serviceCode: 'B', region: 'r1' }
      ],
      matrix: {
        include: [
          { batch_id: '0000', task_ids: [0] },
          { batch_id: '0001', task_ids: [1] }
        ]
      }
    };
    await writeJson(planFile, plan);
    await writeJson(path.join(batchesDir, 'batch-0000.json'), {
      batchId: '0000', taskIds: [0], issues: [], warning: false, classification: 'PRICE_ONLY',
      rateDiff: [{ sku: 'a' }], taskTimings: [{ taskId: 0, elapsedMs: 10 }]
    });
    await writeJson(path.join(batchesDir, 'batch-0001.json'), {
      batchId: '0001', taskIds: [1], issues: [], warning: true, classification: 'STRUCTURE_WARNING',
      rateDiff: [], taskTimings: [{ taskId: 1, elapsedMs: 20 }]
    });

    const merged = await mergeDriftBatches(planFile, batchesDir);
    assert.equal(merged.status, 'passed');
    assert.equal(merged.classification, 'STRUCTURE_WARNING');
    assert.equal(merged.publishable, true);
    assert.equal(merged.batches, 2);
    assert.equal(merged.rateDiff.length, 1);

    await rm(path.join(batchesDir, 'batch-0001.json'));
    await assert.rejects(() => mergeDriftBatches(planFile, batchesDir), /Missing drift batches/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
