import test from 'node:test';
import assert from 'node:assert/strict';
import { assignBatchesToWorkers, logicalBatchesFromPlan, validateWorkerAssignments } from '../../tools/pricing-cli/work-pool.js';

test('worker pool caps jobs at eight and assigns every logical batch exactly once', () => {
  const batches = Array.from({ length: 25 }, (_, index) => ({
    batch_id: String(index).padStart(4, '0'),
    planned_cases: index % 7 === 0 ? 50000 : 10000
  }));
  const workers = assignBatchesToWorkers(batches, 8);
  assert.equal(workers.length, 8);
  const assigned = workers.flatMap(worker => worker.batches.map(batch => batch.batch_id));
  assert.deepEqual([...assigned].sort(), batches.map(batch => batch.batch_id));
  assert.equal(new Set(assigned).size, batches.length);
});

test('worker assignment is deterministic and logical batch extraction supports legacy plans', () => {
  const batches = [
    { batch_id: '0000', planned_cases: 10 },
    { batch_id: '0001', planned_cases: 30 },
    { batch_id: '0002', planned_cases: 20 }
  ];
  const first = assignBatchesToWorkers(batches, 2);
  assert.deepEqual(first, assignBatchesToWorkers(batches, 2));
  const plan = { batches, matrix: { include: first }, summary: { workers: 2 } };
  validateWorkerAssignments(plan);
  assert.deepEqual(logicalBatchesFromPlan(plan), batches);
  assert.deepEqual(logicalBatchesFromPlan({ matrix: { include: batches } }), batches);
});

test('worker assignment validation rejects duplicate logical batches', () => {
  const batch = { batch_id: '0000', planned_cases: 10 };
  assert.throws(() => validateWorkerAssignments({
    batches: [batch],
    matrix: { include: [
      { worker_id: '00', batches: [batch] },
      { worker_id: '01', batches: [batch] }
    ] },
    summary: { workers: 2 }
  }), /count|more than once/);
});

test('zero-case structural drift batches never generate empty workers', () => {
  const batches = Array.from({ length: 6 }, (_, index) => ({
    batch_id: String(index).padStart(4, '0'),
    planned_cases: 0,
    include_structural: true
  }));
  const workers = assignBatchesToWorkers(batches, 8);
  assert.equal(workers.length, 6);
  assert.ok(workers.every(worker => worker.batches.length === 1 && worker.planned_cases === 0));
  validateWorkerAssignments({ batches, matrix: { include: workers }, summary: { workers: 6 } });
});
