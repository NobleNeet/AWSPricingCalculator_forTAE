import { parentPort, workerData } from 'node:worker_threads';
import path from 'node:path';
import { loadPackages, readJson } from './package-loader.js';
import { classifyChange } from './drift.js';
import { loadProductsForSkus } from './product-chunks.js';

const packages = await loadPackages();
const packageGroups = new Map();
for (const pkg of packages) {
  const serviceCodes = new Set([
    pkg.service.priceSource.serviceCode,
    ...Object.values(pkg.service.priceSource.componentOverrides ?? {})
  ]);
  for (const serviceCode of serviceCodes) {
    const group = packageGroups.get(serviceCode) ?? [];
    group.push(pkg);
    packageGroups.set(serviceCode, group);
  }
}

async function runTask(task) {
  const started = performance.now();
  const { serviceCode, region, hasBefore, hasAfter, publishSkus } = task;
  const key = `${serviceCode}/${region}`;
  const servicePackages = packageGroups.get(serviceCode) ?? [];
  const before = hasBefore
    ? await readJson(path.join(workerData.previousDirectory, 'sources', serviceCode, region, 'products.json'))
    : undefined;
  const after = hasAfter
    ? await loadProductsForSkus(
      workerData.candidateDirectory,
      { serviceCode, region },
      new Set(publishSkus)
    )
    : undefined;
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
    candidateProductsLoaded: after?.products.length ?? 0,
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
