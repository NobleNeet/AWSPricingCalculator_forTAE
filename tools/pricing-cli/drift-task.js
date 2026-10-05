import path from 'node:path';
import { readJson } from './package-loader.js';
import { classifyChange } from './drift.js';
import { loadProductsForSkus } from './product-chunks.js';

function packagesForServiceCode(packages, serviceCode) {
  return packages.filter(pkg => new Set([
    pkg.service.priceSource.serviceCode,
    ...Object.values(pkg.service.priceSource.componentOverrides ?? {})
  ]).has(serviceCode));
}

export async function runDriftTask(packages, task, { previousDirectory, candidateDirectory }) {
  const started = performance.now();
  const { serviceCode, region, hasBefore, hasAfter, publishSkus } = task;
  const key = `${serviceCode}/${region}`;
  const servicePackages = packagesForServiceCode(packages, serviceCode);
  const before = hasBefore
    ? await readJson(path.join(previousDirectory, 'sources', serviceCode, region, 'products.json'))
    : undefined;
  const after = hasAfter
    ? await loadProductsForSkus(
      candidateDirectory,
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
