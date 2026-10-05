import path from 'node:path';
import { readJson } from './package-loader.js';
import { classifyChange } from './drift.js';
import { loadProductsForSkus } from './product-chunks.js';
import { priceSourceForComponent } from '../../src/pricing/mapping.js';

function sourceScopedPackage(pkg, serviceCode) {
  const profiles = Object.fromEntries(Object.entries(pkg.profiles).map(([profileId, profile]) => [
    profileId,
    {
      ...profile,
      components: profile.components.filter(componentId => priceSourceForComponent(pkg, componentId) === serviceCode)
    }
  ]));
  const hasComponents = Object.values(profiles).some(profile => profile.components.length > 0);
  return hasComponents ? { ...pkg, profiles } : null;
}

function packagesForServiceCode(packages, serviceCode) {
  return packages.map(pkg => sourceScopedPackage(pkg, serviceCode)).filter(Boolean);
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

  const defaultSourcePackages = servicePackages.filter(pkg => pkg.service.priceSource.serviceCode === serviceCode);
  let checked = { classification: 'PRICE_ONLY', publishable: true, issues: [], rateDiff: [] };
  let warning = false;

  if (defaultSourcePackages.length) {
    checked = classifyChange(
      defaultSourcePackages,
      before ? { [key]: before } : {},
      after ? { [key]: after } : {},
      []
    );
    warning ||= checked.classification === 'STRUCTURE_WARNING';
  }

  // A component-level override or Pricing Mapping can use a different AWS service
  // from the package's default price source. Candidate semantic validation already
  // resolved those components with all required sources together. Re-evaluating the
  // whole package here with only this one source fabricates PRICE_SOURCE_NOT_FOUND
  // errors for the other sources. Drift therefore treats secondary sources as a
  // conservative structural warning and leaves semantic correctness to the validated
  // Mapping/price-data report.
  if (servicePackages.some(pkg => pkg.service.priceSource.serviceCode !== serviceCode)) warning = true;
  if (!before || !after) warning = true;

  return {
    taskId: task.taskId,
    serviceCode,
    region,
    issues: checked.issues,
    warning,
    rateDiff: checked.rateDiff,
    candidateProductsLoaded: after?.products.length ?? 0,
    elapsedMs: Math.round(performance.now() - started)
  };
}
