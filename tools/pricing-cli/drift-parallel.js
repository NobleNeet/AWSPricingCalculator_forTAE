import os from 'node:os';
import { Worker } from 'node:worker_threads';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function driftTasks(packages, previous, candidate, publishSkus) {
  const tasks = [];
  let missingService = false;
  const serviceCodes = [...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))];
  for (const serviceCode of serviceCodes) {
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
  const defaultConcurrency = Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(tasks.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_CONCURRENCY, defaultConcurrency));
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
        worker.postMessage({ type: 'stop' });
        return;
      }
      worker.currentTask = tasks[index];
      worker.postMessage({ type: 'task', task: tasks[index] });
    };
    for (let index = 0; index < concurrency; index++) {
      const worker = createWorker(previousDirectory, candidateDirectory);
      workers.push(worker);
      worker.on('message', message => {
        if (message.type === 'error') {
          fail(new Error(message.error));
          return;
        }
        if (message.type !== 'result') return;
        const result = message.result;
        results[result.taskId] = result;
        completed += 1;
        console.log(`classify-change task: service=${result.serviceCode}, region=${result.region}, rate_diff=${result.rateDiff.length}, elapsed_ms=${result.elapsedMs}`);
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
          fail(new Error(`Drift worker exited with code ${code}${task ? ` for ${task.serviceCode}/${task.region}` : ''}`));
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
