import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { sourceTasks } from './semantic-parallel.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createWorker(directory) {
  return new Worker(new URL('./semantic-validation-worker.js', import.meta.url), {
    workerData: { directory }
  });
}

async function countTaskCases(directory, tasks, concurrency) {
  if (!tasks.length) return [];
  const results = new Array(tasks.length);
  const workers = [];
  let cursor = 0;
  let completed = 0;
  let settled = false;

  const finished = new Promise((resolve, reject) => {
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const dispatch = worker => {
      if (settled) return;
      const index = cursor++;
      if (index >= tasks.length) {
        worker.currentTask = null;
        worker.postMessage({ type: 'stop' });
        return;
      }
      const task = { ...tasks[index], taskId: index, planOnly: true, includeCoverage: false };
      worker.currentTask = task;
      console.log(`semantic-plan task start: service=${task.serviceCode}, region=${task.region}, task=${index + 1}/${tasks.length}`);
      worker.postMessage({ type: 'task', task });
    };

    for (let index = 0; index < concurrency; index++) {
      const worker = createWorker(directory);
      workers.push(worker);
      worker.on('message', message => {
        if (message.type === 'error') {
          fail(new Error(message.error));
          return;
        }
        if (message.type !== 'result') return;
        results[message.result.taskId] = message.result;
        completed += 1;
        console.log(`semantic-plan task done: service=${message.result.serviceCode}, region=${message.result.region}, cases=${message.result.caseCount}, scanned_products=${message.result.scannedProducts}, selected_products=${message.result.selectedProducts}, chunks=${message.result.chunks}, progress=${completed}/${tasks.length}`);
        if (completed === tasks.length) {
          if (!settled) {
            settled = true;
            for (const active of workers) active.postMessage({ type: 'stop' });
            resolve();
          }
          return;
        }
        dispatch(worker);
      });
      worker.on('error', fail);
      worker.on('exit', code => {
        if (!settled && code !== 0) {
          const task = worker.currentTask;
          fail(new Error(`Semantic plan worker exited with code ${code}${task ? ` for ${task.serviceCode}/${task.region}` : ''}`));
        }
      });
      dispatch(worker);
    }
  });

  try {
    await finished;
  } finally {
    await Promise.allSettled(workers.map(worker => worker.terminate()));
  }
  return results;
}

export function buildSemanticBatches(taskResults, requestedBatchCases = 25000, maxBatches = 240) {
  const totalCases = taskResults.reduce((sum, result) => sum + (result.caseCount ?? 0), 0);
  const minimumBatchCases = totalCases > 0 ? Math.ceil(totalCases / maxBatches) : 1;
  const batchCases = Math.max(positiveInt(requestedBatchCases, 25000), minimumBatchCases);
  const batches = [];

  for (const result of taskResults) {
    const caseCount = result.caseCount ?? 0;
    const count = Math.max(1, Math.ceil(caseCount / batchCases));
    for (let batchIndex = 0; batchIndex < count; batchIndex++) {
      const caseOffset = batchIndex * batchCases;
      batches.push({
        batch_id: String(batches.length).padStart(4, '0'),
        source_task_id: result.globalTaskId,
        service_code: result.serviceCode,
        region: result.region,
        case_offset: caseOffset,
        case_limit: Math.max(1, Math.min(batchCases, Math.max(0, caseCount - caseOffset))),
        include_coverage: Boolean(result.includeCoverage && batchIndex === 0),
        include_defaults: batchIndex === 0,
        planned_cases: Math.max(0, Math.min(batchCases, caseCount - caseOffset))
      });
    }
  }

  if (batches.length > maxBatches) throw new Error(`Semantic batch plan exceeded matrix limit: ${batches.length} > ${maxBatches}`);
  return { batches, totalCases, batchCases, maxBatches };
}

export async function planSemanticBatches(packages, directory, manifest, options = {}) {
  const tasks = sourceTasks(packages, manifest);
  const cpuLimit = Math.max(1, Math.min(2, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(tasks.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_PLAN_CONCURRENCY, cpuLimit));
  const taskResults = await countTaskCases(directory, tasks, concurrency);
  const enriched = taskResults.map((result, index) => ({
    ...result,
    globalTaskId: tasks[index].taskId,
    includeCoverage: tasks[index].includeCoverage
  }));
  const built = buildSemanticBatches(
    enriched,
    options.batchCases ?? process.env.PRICE_VALIDATE_WORKFLOW_BATCH_CASES ?? 25000,
    positiveInt(options.maxBatches ?? process.env.PRICE_VALIDATE_MAX_WORKFLOW_BATCHES, 240)
  );
  return {
    matrix: { include: built.batches },
    summary: {
      sourceTasks: tasks.length,
      totalCases: built.totalCases,
      batchCases: built.batchCases,
      batches: built.batches.length,
      maxBatches: built.maxBatches,
      plannerConcurrency: concurrency
    },
    tasks: enriched.map(result => ({
      taskId: result.globalTaskId,
      serviceCode: result.serviceCode,
      region: result.region,
      caseCount: result.caseCount,
      scannedProducts: result.scannedProducts,
      selectedProducts: result.selectedProducts,
      chunks: result.chunks,
      includeCoverage: result.includeCoverage
    }))
  };
}
