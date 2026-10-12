import test from 'node:test';
import assert from 'node:assert/strict';
import { assignBatchesToWorkers, validateWorkerAssignments } from '../../tools/pricing-cli/work-pool.js';

function makePlan() {
  const batches = Array.from({ length: 17 }, (_, index) => ({
    batch_id: String(index).padStart(4, '0'),
    planned_cases: index + 1,
    case_offset: index * 100,
    case_limit: 100
  }));
  const workers = assignBatchesToWorkers(structuredClone(batches), 8);
  return { batches, matrix: { include: workers }, summary: { workers: workers.length } };
}

test('worker pool is deterministic and bounded by eight workers', () => {
  const plan = makePlan();
  assert.equal(plan.matrix.include.length, 8);
  assert.deepEqual(assignBatchesToWorkers(plan.batches, 8), plan.matrix.include);
  assert.doesNotThrow(() => validateWorkerAssignments(plan));
});

test('worker assignments reject missing, duplicate or altered logical batches', () => {
  for (const mutate of [
    plan => { plan.matrix.include[0].batches.pop(); },
    plan => { plan.matrix.include[0].batches.push(plan.matrix.include[1].batches[0]); },
    plan => { plan.matrix.include[0].batches[0].case_offset += 1; },
    plan => { plan.matrix.include[0].planned_cases += 1; },
    plan => { plan.matrix.include[1].worker_id = plan.matrix.include[0].worker_id; },
    plan => { plan.matrix.include.push({ worker_id: 'extra', planned_cases: 1, batches: [plan.batches[0]] }); }
  ]) {
    const plan = makePlan();
    mutate(plan);
    assert.throws(() => validateWorkerAssignments(plan));
  }
});

test('small workloads allocate only as many workers as batches', () => {
  const batches = [{ batch_id: '0000', planned_cases: 0 }];
  const workers = assignBatchesToWorkers(batches, 8);
  assert.equal(workers.length, 1);
  assert.doesNotThrow(() => validateWorkerAssignments({ batches, matrix: { include: workers }, summary: { workers: 1 } }));
});
