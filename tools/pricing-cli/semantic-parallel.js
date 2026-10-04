import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { COVERAGE_REFERENCE_REGION } from './semantics.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sourceTasks(packages, manifest) {
  const serviceCodes = [...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))];
  const tasks = [];
  for (const serviceCode of serviceCodes) {
    const sources = Object.entries(manifest.sources?.[serviceCode] ?? {});
    const coverageRegion = sources.some(([region]) => region === COVERAGE_REFERENCE_REGION)
      ? COVERAGE_REFERENCE_REGION
      : sources[0]?.[0];
    for (const [region, source] of sources) {
      tasks.push({
        taskId: tasks.length,
        serviceCode,
        region,
        productsPath: source.productsPath,
        includeCoverage: region === coverageRegion
      });
    }
  }
  return tasks;
}

function createWorker(directory) {
  return new Worker(new URL('./semantic-validation-worker.js', import.meta.url), {
    workerData: { directory }
  });
}

export async function validatePublishedPriceDataParallel(packages, directory, manifest, options = {}) {
  const tasks = sourceTasks(packages, manifest);
  const defaultConcurrency = Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(tasks.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_CONCURRENCY, defaultConcurrency));
  if (!tasks.length) return { issues: [], coverage: {}, branches: 0, publishSkus: {}, concurrency, taskTimings: [] };

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
        const result = message.result;
        console.log(`validate-price-data task: service=${result.serviceCode}, region=${result.region}, branches=${result.branches}, products=${result.products}, elapsed_ms=${result.elapsedMs}`);
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
          fail(new Error(`Semantic validation worker exited with code ${code}${task ? ` for ${task.serviceCode}/${task.region}` : ''}`));
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

  const taskTimings = results.map(result => ({
    serviceCode: result.serviceCode,
    region: result.region,
    branches: result.branches,
    products: result.products,
    elapsedMs: result.elapsedMs
  }));
  const publishSkus = Object.fromEntries(results.map(result => [
    `${result.serviceCode}/${result.region}`,
    new Set(result.publishSkus)
  ]));

  return {
    issues: results.flatMap(result => result.issues),
    coverage: Object.assign({}, ...results.map(result => result.coverage)),
    branches: results.reduce((sum, result) => sum + result.branches, 0),
    publishSkus,
    concurrency,
    taskTimings
  };
}
