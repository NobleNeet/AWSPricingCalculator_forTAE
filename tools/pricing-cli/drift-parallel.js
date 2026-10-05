import os from 'node:os';
import { Worker } from 'node:worker_threads';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function priceSourceCodes(packages) {
  return [...new Set(packages.flatMap(pkg => [
    pkg.service.priceSource.serviceCode,
    ...Object.values(pkg.service.priceSource.componentOverrides ?? {}),
    ...Object.values(pkg.pricingMappings ?? {}).map(mapping => mapping.priceSource.serviceCode)
  ]))];
}

export function driftTasks(packages, previous, candidate, publishSkus) {
  const tasks = [];
  let missingService = false;
  for (const serviceCode of priceSourceCodes(packages)) {
    const keys = new Set([
      ...Object.entries(previous).filter(([, source]) => source.serviceCode === serviceCode).map(([key]) => key),
      ...Object.entries(candidate).filter(([, source]) => source.serviceCode === serviceCode).map(([key]) => key)
    ]);
    if (!keys.size) {
      missingService = true;
      continue;
    }
    for (const key of keys) {
      const before = previous[key];
      const after = candidate[key];
      const source = after ?? before;
      tasks.push({
        taskId: tasks.length,
        serviceCode,
        region: source.region,
        hasBefore: Boolean(before),
        hasAfter: Boolean(after),
        publishSkus: [...(publishSkus[key] ?? new Set())]
      });
    }
  }
  return { tasks, missingService };
}

function createWorker(previousDirectory, candidateDirectory) {
  return new Worker(new URL('./drift-validation-worker.js', import.meta.url), {
    workerData: { previousDirectory, candidateDirectory }
  });
}

export async function classifyChangeParallel(packages, previousDirectory, candidateDirectory, previous, candidate, publishSkus, candidateIssues = [], options = {}) {
  const { tasks, missingService } = driftTasks(packages, previous, candidate, publishSkus);
  const cpuLimit = Math.max(1, Math.min(2, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(tasks.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_CONCURRENCY, cpuLimit));
  const taskTimeoutMs = positiveInt(options.taskTimeoutMs ?? process.env.PRICE_DRIFT_TASK_TIMEOUT_MS, 10 * 60 * 1000);
  const heartbeatMs = positiveInt(options.heartbeatMs ?? process.env.PRICE_DRIFT_HEARTBEAT_MS, 30 * 1000);
  const candidateBreaks = candidateIssues.filter(issue => issue.severity === 'error');
  if (!tasks.length) {
    return {
      classification: candidateBreaks.length ? 'STRUCTURE_BREAKING' : 'STRUCTURE_WARNING',
      publishable: !candidateBreaks.length,
      issues: candidateBreaks,
      rateDiff: [],
      concurrency,
      taskTimings: []
    };
  }

  const results = new Array(tasks.length);
  const workers = [];
  const timers = new Map();
  let cursor = 0;
  let completed = 0;
  let settled = false;

  const clearWorkerTimer = worker => {
    const timer = timers.get(worker);
    if (timer) clearTimeout(timer);
    timers.delete(worker);
  };

  const finished = new Promise((resolve, reject) => {
    const fail = error => {
      if (settled) return;
      settled = true;
      for (const worker of workers) clearWorkerTimer(worker);
      reject(error);
    };
    const dispatch = worker => {
      if (settled) return;
      clearWorkerTimer(worker);
      const index = cursor++;
      if (index >= tasks.length) {
        worker.postMessage({ type: 'stop' });
        return;
      }
      const task = tasks[index];
      worker.currentTask = task;
      worker.currentTaskStartedAt = Date.now();
      console.log(`classify-change task start: service=${task.serviceCode}, region=${task.region}, task=${task.taskId + 1}/${tasks.length}`);
      timers.set(worker, setTimeout(() => {
        fail(new Error(`Drift task timed out after ${taskTimeoutMs}ms for ${task.serviceCode}/${task.region}`));
      }, taskTimeoutMs));
      worker.postMessage({ type: 'task', task });
    };
    for (let index = 0; index < concurrency; index++) {
      const worker = createWorker(previousDirectory, candidateDirectory);
      workers.push(worker);
      worker.on('message', message => {
        if (message.type === 'error') {
          clearWorkerTimer(worker);
          fail(new Error(message.error));
          return;
        }
        if (message.type !== 'result') return;
        clearWorkerTimer(worker);
        const result = message.result;
        results[result.taskId] = result;
        completed += 1;
        console.log(`classify-change task done: service=${result.serviceCode}, region=${result.region}, rate_diff=${result.rateDiff.length}, elapsed_ms=${result.elapsedMs}, completed=${completed}/${tasks.length}`);
        if (completed === tasks.length) {
          if (!settled) {
            settled = true;
            for (const active of workers) {
              clearWorkerTimer(active);
              active.postMessage({ type: 'stop' });
            }
            resolve();
          }
          return;
        }
        dispatch(worker);
      });
      worker.on('error', fail);
      worker.on('exit', code => {
        clearWorkerTimer(worker);
        if (!settled && code !== 0) {
          const task = worker.currentTask;
          fail(new Error(`Drift worker exited with code ${code}${task ? ` for ${task.serviceCode}/${task.region}` : ''}`));
        }
      });
      dispatch(worker);
    }
  });

  const heartbeat = setInterval(() => {
    if (settled) return;
    const active = workers
      .filter(worker => worker.currentTask && !results[worker.currentTask.taskId])
      .map(worker => `${worker.currentTask.serviceCode}/${worker.currentTask.region}:${Math.round((Date.now() - worker.currentTaskStartedAt) / 1000)}s`);
    console.log(`classify-change heartbeat: completed=${completed}/${tasks.length}, active=${active.join(',') || 'none'}`);
  }, heartbeatMs);

  try {
    await finished;
  } finally {
    clearInterval(heartbeat);
    for (const worker of workers) clearWorkerTimer(worker);
    await Promise.allSettled(workers.map(worker => worker.terminate()));
  }

  const issues = [...candidateBreaks, ...results.flatMap(result => result.issues)];
  const warning = missingService || results.some(result => result.warning);
  return {
    classification: issues.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !issues.length,
    issues,
    rateDiff: results.flatMap(result => result.rateDiff),
    concurrency,
    taskTimings: results.map(result => ({
      serviceCode: result.serviceCode,
      region: result.region,
      rateDiff: result.rateDiff.length,
      elapsedMs: result.elapsedMs
    }))
  };
}
