import os from 'node:os';
import { Worker } from 'node:worker_threads';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sourceGroups(packages, manifest) {
  const services = new Map();
  for (const pkg of packages) {
    const serviceCode = pkg.service.priceSource.serviceCode;
    const current = services.get(serviceCode) ?? { serviceCode, serviceIds: [], sources: [] };
    current.serviceIds.push(pkg.service.id);
    services.set(serviceCode, current);
  }
  for (const group of services.values()) {
    group.sources = Object.entries(manifest.sources?.[group.serviceCode] ?? {}).map(([region, source]) => ({
      region,
      productsPath: source.productsPath
    }));
  }
  return [...services.values()];
}

function runWorker(group, directory) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./semantic-validation-worker.js', import.meta.url), {
      workerData: { ...group, directory }
    });
    worker.once('message', message => {
      if (message.error) reject(new Error(message.error));
      else resolve(message);
    });
    worker.once('error', reject);
    worker.once('exit', code => {
      if (code !== 0) reject(new Error(`Semantic validation worker exited with code ${code} for ${group.serviceCode}`));
    });
  });
}

export async function validatePublishedPriceDataParallel(packages, directory, manifest, options = {}) {
  const groups = sourceGroups(packages, manifest);
  const defaultConcurrency = Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length ?? 1));
  const concurrency = Math.min(groups.length || 1, positiveInt(options.concurrency ?? process.env.PRICE_VALIDATE_CONCURRENCY, defaultConcurrency));
  const results = new Array(groups.length);
  let cursor = 0;

  async function workerLoop() {
    while (true) {
      const index = cursor++;
      if (index >= groups.length) return;
      results[index] = await runWorker(groups[index], directory);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => workerLoop()));

  return {
    issues: results.flatMap(result => result.issues),
    coverage: Object.assign({}, ...results.map(result => result.coverage)),
    branches: results.reduce((sum, result) => sum + result.branches, 0),
    concurrency
  };
}
