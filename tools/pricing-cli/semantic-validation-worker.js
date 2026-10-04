import { parentPort, workerData } from 'node:worker_threads';
import path from 'node:path';
import { loadPackages, readJson } from './package-loader.js';
import { validatePriceData } from './semantics.js';

const packages = await loadPackages();
const common = await readJson('pricing/normalization/common.json');
const packageGroups = new Map();
const normalizers = new Map();

for (const pkg of packages) {
  const serviceCode = pkg.service.priceSource.serviceCode;
  const group = packageGroups.get(serviceCode) ?? [];
  group.push(pkg);
  packageGroups.set(serviceCode, group);
}

async function normalizerFor(serviceCode) {
  if (normalizers.has(serviceCode)) return normalizers.get(serviceCode);
  const normalizer = await readJson(`pricing/normalization/services/${serviceCode}.json`).catch(error => {
    if (error.code === 'ENOENT') return { rules: [], discriminators: [] };
    throw error;
  });
  normalizers.set(serviceCode, normalizer);
  return normalizer;
}

async function runTask(task) {
  const started = performance.now();
  const { serviceCode, region, productsPath, includeCoverage } = task;
  const servicePackages = packageGroups.get(serviceCode) ?? [];
  const source = await readJson(path.join(workerData.directory, productsPath));
  const normalizer = await normalizerFor(serviceCode);
  const data = { [`${serviceCode}/${region}`]: source };
  const checked = validatePriceData(
    servicePackages,
    data,
    common,
    { [serviceCode]: normalizer },
    { includeCoverage }
  );
  const publishSkus = new Set();
  for (const resolution of checked.resolutions) {
    const sku = resolution.result.components[resolution.componentId]?.resolution?.product.sku;
    if (sku) publishSkus.add(sku);
  }

  return {
    taskId: task.taskId,
    serviceCode,
    region,
    issues: checked.issues,
    coverage: checked.coverage,
    branches: checked.resolutions.length,
    publishSkus: [...publishSkus],
    products: source.products.length,
    elapsedMs: Math.round(performance.now() - started)
  };
}

parentPort.on('message', async message => {
  if (message.type === 'stop') {
    parentPort.close();
    return;
  }
  if (message.type !== 'task') return;
  try {
    parentPort.postMessage({ type: 'result', result: await runTask(message.task) });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      taskId: message.task.taskId,
      serviceCode: message.task.serviceCode,
      region: message.task.region,
      error: error.stack ?? error.message
    });
  }
});
