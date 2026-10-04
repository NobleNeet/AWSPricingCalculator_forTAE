import { parentPort, workerData } from 'node:worker_threads';
import path from 'node:path';
import { loadPackages, readJson } from './package-loader.js';
import { classifyChange } from './drift.js';

const packages = await loadPackages();
const packageGroups = new Map();
for (const pkg of packages) {
  const serviceCode = pkg.service.priceSource.serviceCode;
  const group = packageGroups.get(serviceCode) ?? [];
  group.push(pkg);
  packageGroups.set(serviceCode, group);
}

async function runTask(task) {
  const started = performance.now();
  const { serviceCode, region, hasBefore, hasAfter, publishSkus } = task;
  const key = `${serviceCode}/${region}`;
  const servicePackages = packageGroups.get(serviceCode) ?? [];
  const before = hasBefore
    ? await readJson(path.join(workerData.previousDirectory, 'sources', serviceCode, region, 'products.json'))
    : undefined;
  let after = hasAfter
    ? await readJson(path.join(workerData.candidateDirectory, 'sources', serviceCode, region, 'products.json'))
    : undefined;
  if (after) {
    const allowed = new Set(publishSkus);
    after = { ...after, products: after.products.filter(product => allowed.has(product.sku)) };
  }
  const checked = classifyChange(
    servicePackages,
    before ? { [key]: before } : {},
    after ? { [key]: after } : {},
    []
  );
  return {
    taskId: task.taskId,
    serviceCode,
    region,
    issues: checked.issues,
    warning: checked.classification === 'STRUCTURE_WARNING',
    rateDiff: checked.rateDiff,
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
