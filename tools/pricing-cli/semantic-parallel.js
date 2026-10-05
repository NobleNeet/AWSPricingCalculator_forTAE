import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { COVERAGE_REFERENCE_REGION } from './semantics.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function sourceTasks(packages, manifest) {
  const packagesByDefaultCode = new Map();
  for (const pkg of packages) {
    const code = pkg.service.priceSource.serviceCode;
    const group = packagesByDefaultCode.get(code) ?? [];
    group.push(pkg);
    packagesByDefaultCode.set(code, group);
  }

  const tasks = [];
  for (const [serviceCode, servicePackages] of packagesByDefaultCode) {
    const sources = Object.entries(manifest.sources?.[serviceCode] ?? {});
    const coverageRegion = sources.some(([region]) => region === COVERAGE_REFERENCE_REGION)
      ? COVERAGE_REFERENCE_REGION
      : sources[0]?.[0];
    const requiredCodes = [...new Set(servicePackages.flatMap(pkg => [
      pkg.service.priceSource.serviceCode,
      ...Object.values(pkg.service.priceSource.componentOverrides ?? {})
    ]))];
    for (const [region] of sources) {
      const sourceDescriptors = Object.fromEntries(requiredCodes
        .map(code => [code, manifest.sources?.[code]?.[region]])
        .filter(([, source]) => source));
      tasks.push({
        taskId: tasks.length,
        serviceCode,
        region,
        sourceDescriptors,
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
  const allTasks = sourceTasks(packages, manifest);
  const shardCount = positiveInt(options.shardCount ?? process.env.PRICE_VALIDATE_SHARD_COUNT, 1);
  const shardIndex = nonNegativeInt(options.shardIndex ?? process.env.PRICE_VALIDATE_SHARD_INDEX, 0);
  if (shardIndex >= shardCount) throw new Error(`Invalid semantic shard ${shardIndex}/${shardCount}`);
  const tasks = allTasks
    .filter(task => task.taskId % shardCount === shardIndex)
    .map((task, taskId) => ({ ...task, globalTaskId: task.taskId, taskId }));
  const cpuLimit = Math.max(1, Math.min(2, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(tasks.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_CONCURRENCY, cpuLimit));
  const taskTimeoutMs = positiveInt(options.taskTimeoutMs ?? process.env.PRICE_VALIDATE_TASK_TIMEOUT_MS, 600000);
  const heartbeatMs = positiveInt(options.heartbeatMs ?? process.env.PRICE_VALIDATE_HEARTBEAT_MS, 30000);
  if (!tasks.length) return { issues: [], coverage: {}, branches: 0, publishSkus: {}, concurrency, taskTimings: [], shardIndex, shardCount };

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

    const clearTaskTimers = worker => {
      if (worker.taskTimeout) clearTimeout(worker.taskTimeout);
      if (worker.heartbeat) clearInterval(worker.heartbeat);
      worker.taskTimeout = null;
      worker.heartbeat = null;
    };

    const armProgressTimeout = worker => {
      if (worker.taskTimeout) clearTimeout(worker.taskTimeout);
      const task = worker.currentTask;
      if (!task) return;
      worker.lastProgressAt = Date.now();
      worker.taskTimeout = setTimeout(() => {
        fail(new Error(`Semantic validation task made no progress for ${taskTimeoutMs} ms for ${task.serviceCode}/${task.region}`));
      }, taskTimeoutMs);
    };

    const dispatch = worker => {
      if (settled) return;
      clearTaskTimers(worker);
      const index = cursor++;
      if (index >= tasks.length) {
        worker.currentTask = null;
        worker.postMessage({ type: 'stop' });
        return;
      }
      const task = tasks[index];
      worker.currentTask = task;
      worker.taskStartedAt = Date.now();
      worker.lastProgressAt = worker.taskStartedAt;
      worker.processedCases = 0;
      console.log(`validate-price-data shard=${shardIndex}/${shardCount} task start: service=${task.serviceCode}, region=${task.region}, task=${index + 1}/${tasks.length}`);
      armProgressTimeout(worker);
      worker.heartbeat = setInterval(() => {
        const elapsedSeconds = Math.round((Date.now() - worker.taskStartedAt) / 1000);
        const idleSeconds = Math.round((Date.now() - worker.lastProgressAt) / 1000);
        console.log(`validate-price-data shard=${shardIndex}/${shardCount} heartbeat: service=${task.serviceCode}, region=${task.region}, elapsed_s=${elapsedSeconds}, idle_s=${idleSeconds}, processed_cases=${worker.processedCases}`);
      }, heartbeatMs);
      worker.postMessage({ type: 'task', task });
    };

    for (let index = 0; index < concurrency; index++) {
      const worker = createWorker(directory);
      workers.push(worker);
      worker.on('message', message => {
        if (message.type === 'error') {
          clearTaskTimers(worker);
          fail(new Error(message.error));
          return;
        }
        if (message.type === 'progress') {
          worker.processedCases = message.processedCases;
          armProgressTimeout(worker);
          console.log(`validate-price-data shard=${shardIndex}/${shardCount} case batch: service=${message.serviceCode}, region=${message.region}, processed_cases=${message.processedCases}, batch_cases=${message.batchCases}, elapsed_ms=${message.elapsedMs}`);
          return;
        }
        if (message.type !== 'result') return;
        clearTaskTimers(worker);
        results[message.result.taskId] = message.result;
        completed += 1;
        const result = message.result;
        console.log(`validate-price-data shard=${shardIndex}/${shardCount} task done: service=${result.serviceCode}, region=${result.region}, branches=${result.branches}, scanned_products=${result.scannedProducts}, selected_products=${result.selectedProducts}, chunks=${result.chunks}, elapsed_ms=${result.elapsedMs}, progress=${completed}/${tasks.length}`);
        if (completed === tasks.length) {
          if (!settled) {
            settled = true;
            for (const active of workers) {
              clearTaskTimers(active);
              active.postMessage({ type: 'stop' });
            }
            resolve();
          }
          return;
        }
        dispatch(worker);
      });
      worker.on('error', error => {
        clearTaskTimers(worker);
        fail(error);
      });
      worker.on('exit', code => {
        clearTaskTimers(worker);
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
    scannedProducts: result.scannedProducts,
    selectedProducts: result.selectedProducts,
    chunks: result.chunks,
    elapsedMs: result.elapsedMs
  }));
  const publishSkus = {};
  for (const result of results) for (const [key, skus] of Object.entries(result.publishSkus ?? {})) {
    const target = publishSkus[key] ?? new Set();
    for (const sku of skus) target.add(sku);
    publishSkus[key] = target;
  }

  return {
    issues: results.flatMap(result => result.issues),
    coverage: Object.assign({}, ...results.map(result => result.coverage)),
    branches: results.reduce((sum, result) => sum + result.branches, 0),
    publishSkus,
    concurrency,
    taskTimings,
    shardIndex,
    shardCount
  };
}
