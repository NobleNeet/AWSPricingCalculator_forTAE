function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function assignBatchesToWorkers(batches, requestedWorkers = 8) {
  if (!batches.length) return [];
  const workerCount = Math.min(batches.length, positiveInt(requestedWorkers, 8));
  const workers = Array.from({ length: workerCount }, (_, index) => ({
    worker_id: String(index).padStart(2, '0'),
    planned_cases: 0,
    batches: []
  }));
  const ordered = [...batches].sort((a, b) =>
    (b.planned_cases ?? 0) - (a.planned_cases ?? 0)
      || String(a.batch_id).localeCompare(String(b.batch_id))
  );
  // Seed each worker with one batch before balancing by planned cases.
  // Zero-case structural drift batches still require a worker: comparing only
  // planned_cases used to assign them all to worker 00 and leave empty jobs.
  for (const [index, batch] of ordered.entries()) {
    const worker = index < workerCount
      ? workers[index]
      : workers.reduce((best, candidate) =>
        candidate.planned_cases < best.planned_cases
          || (candidate.planned_cases === best.planned_cases
            && candidate.batches.length < best.batches.length)
          || (candidate.planned_cases === best.planned_cases
            && candidate.batches.length === best.batches.length
            && candidate.worker_id < best.worker_id)
          ? candidate
          : best
      );
    worker.batches.push(batch);
    worker.planned_cases += batch.planned_cases ?? 0;
  }
  for (const worker of workers) worker.batches.sort((a, b) => String(a.batch_id).localeCompare(String(b.batch_id)));
  return workers;
}

export function logicalBatchesFromPlan(plan) {
  if (Array.isArray(plan.batches)) return plan.batches;
  const matrix = plan.matrix?.include ?? [];
  return matrix.flatMap(item => Array.isArray(item.batches) ? item.batches : [item]);
}

export function validateWorkerAssignments(plan) {
  const batches = logicalBatchesFromPlan(plan);
  const matrix = plan.matrix?.include ?? [];
  if (!matrix.some(item => Array.isArray(item.batches))) return;
  if (matrix.length > 8) throw new Error('Worker count exceeds the 8-worker limit');
  const workerIds = matrix.map(worker => worker.worker_id);
  if (workerIds.some(id => typeof id !== 'string') || new Set(workerIds).size !== workerIds.length) {
    throw new Error('Missing or duplicate worker id');
  }
  const expected = new Set(batches.map(batch => batch.batch_id));
  const canonical = new Map(batches.map(batch => [batch.batch_id, batch]));
  if (expected.size !== batches.length) throw new Error('Duplicate logical batch id in plan');
  const assigned = matrix.flatMap(worker => worker.batches ?? []);
  if (assigned.length !== batches.length) throw new Error('Worker assignment count does not match logical batch inventory');
  const seen = new Set();
  for (const worker of matrix) {
    if (!Array.isArray(worker.batches) || worker.batches.length === 0) throw new Error(`Empty worker assignment: ${worker.worker_id}`);
    const total = worker.batches.reduce((sum, batch) => sum + (batch.planned_cases ?? 0), 0);
    if (total !== worker.planned_cases) throw new Error(`Worker planned case count mismatch: ${worker.worker_id}`);
  }
  for (const batch of assigned) {
    if (!expected.has(batch.batch_id)) throw new Error(`Worker assignment contains unknown batch ${batch.batch_id}`);
    if (seen.has(batch.batch_id)) throw new Error(`Logical batch assigned more than once: ${batch.batch_id}`);
    if (JSON.stringify(batch) !== JSON.stringify(canonical.get(batch.batch_id))) {
      throw new Error(`Worker assignment differs from planned logical batch: ${batch.batch_id}`);
    }
    seen.add(batch.batch_id);
  }
  if (seen.size !== expected.size) throw new Error('Worker assignment is missing logical batches');
  if (plan.summary?.workers !== undefined && plan.summary.workers !== matrix.length) throw new Error('Worker count does not match plan summary');
}
