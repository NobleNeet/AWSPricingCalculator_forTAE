import path from 'node:path';
import { readJson } from './package-loader.js';
import { classifyChange, semanticProduct } from './drift.js';
import { loadProductsForSkus } from './publication-candidate.js';
import { priceSourceForComponent } from '../../src/pricing/mapping.js';
import { checksum } from './hash.js';
import { semanticEncode } from './semantic-json.js';

export function sourceScopedPackage(pkg, serviceCode) {
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

function productDigest(products) {
  return checksum(semanticEncode(products));
}

export function priceOnlyChangedSkus(before, after) {
  if (!before || !after) return null;
  const beforeBySku = new Map(before.products.map(product => [product.sku, product]));
  const afterBySku = new Map(after.products.map(product => [product.sku, product]));
  if (beforeBySku.size !== afterBySku.size) return null;
  for (const sku of beforeBySku.keys()) if (!afterBySku.has(sku)) return null;

  const changed = new Set();
  for (const [sku, oldProduct] of beforeBySku) {
    const nextProduct = afterBySku.get(sku);
    if (checksum(semanticEncode(semanticProduct(oldProduct))) !== checksum(semanticEncode(semanticProduct(nextProduct)))) return null;
    if (checksum(semanticEncode(oldProduct)) !== checksum(semanticEncode(nextProduct))) changed.add(sku);
  }
  return changed;
}

export async function runDriftTask(packages, task, { previousDirectory, candidateDirectory }, options = {}) {
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
  let checked = {
    classification: 'PRICE_ONLY',
    publishable: true,
    issues: [],
    rateDiff: [],
    processedCases: 0,
    seenCases: 0,
    progressCases: 0,
    reusedCases: 0,
    exhausted: false
  };
  let warning = false;
  let reuseMode = 'none';

  if (defaultSourcePackages.length && before && after && productDigest(before.products) === productDigest(after.products)) {
    reuseMode = 'region-identical';
  } else if (defaultSourcePackages.length) {
    const changedSkus = priceOnlyChangedSkus(before, after);
    const optimizedOptions = changedSkus
      ? { ...options, priceOnlyChangedSkus: changedSkus }
      : options;
    if (changedSkus) reuseMode = changedSkus.size ? 'price-only-sku' : 'region-identical';
    if (changedSkus?.size === 0) {
      // Exact product equality is normally caught above. Keep this as a defensive
      // path for semantically identical representations.
      reuseMode = 'region-identical';
    } else {
      checked = classifyChange(
        defaultSourcePackages,
        before ? { [key]: before } : {},
        after ? { [key]: after } : {},
        [],
        optimizedOptions
      );
      warning ||= checked.classification === 'STRUCTURE_WARNING';
    }
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
    reuseMode,
    candidateProductsLoaded: after?.products.length ?? 0,
    processedCases: checked.processedCases,
    seenCases: checked.seenCases,
    progressCases: checked.progressCases,
    reusedCases: checked.reusedCases ?? 0,
    exhausted: checked.exhausted,
    elapsedMs: Math.round(performance.now() - started)
  };
}
