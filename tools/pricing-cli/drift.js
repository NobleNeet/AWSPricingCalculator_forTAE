import { createHash } from 'node:crypto';
import { evaluateService } from '../../src/pricing/core.js';
import { reachableCaseIterator } from './semantics.js';
import { semanticEncode } from './semantic-json.js';

export function semanticProduct(product) {
  return {
    ...product,
    terms: {
      onDemand: product.terms.onDemand.map(term => ({
        ...term,
        effectiveDate: undefined,
        priceDimensions: term.priceDimensions.map(dimension => ({
          ...dimension,
          pricePerUnit: undefined
        }))
      }))
    }
  };
}

function semanticDigest(data) {
  const hash = createHash('sha256');
  hash.update(`${data.products.length}\n`);
  for (const product of data.products) {
    hash.update(semanticEncode(semanticProduct(product)));
    hash.update('\n');
  }
  return hash.digest('hex');
}

export function classifyChange(packages, previous, candidate, candidateIssues = [], options = {}) {
  const {
    caseOffset = 0,
    caseLimit = Number.POSITIVE_INFINITY,
    includeStructural = true,
    caseBatchSize = 250,
    onCaseBatch,
    priceOnlyChangedSkus
  } = options;
  const changedSkuSet = priceOnlyChangedSkus
    ? (priceOnlyChangedSkus instanceof Set ? priceOnlyChangedSkus : new Set(priceOnlyChangedSkus))
    : null;
  const breaks = candidateIssues.filter(i => i.severity === 'error');
  let warning = false;
  const rateDiff = [];
  let seenCases = 0;
  let processedCases = 0;
  let progressCases = 0;
  let batchCases = 0;
  let exhausted = false;
  let reusedCases = 0;

  const emitProgress = force => {
    if (!onCaseBatch || (!force && batchCases < caseBatchSize) || batchCases === 0) return;
    onCaseBatch({
      seenCases,
      processedCases,
      batchCases,
      caseOffset,
      caseLimit
    });
    batchCases = 0;
  };

  packageLoop:
  for (const pkg of packages) {
    const code = pkg.service.priceSource.serviceCode;
    const keys = new Set([
      ...Object.entries(previous).filter(([, source]) => source.serviceCode === code).map(([key]) => key),
      ...Object.entries(candidate).filter(([, source]) => source.serviceCode === code).map(([key]) => key)
    ]);
    if (!keys.size) {
      warning = true;
      continue;
    }

    for (const key of keys) {
      const before = previous[key];
      const after = candidate[key];
      if (!before || !after) {
        warning = true;
        continue;
      }
      if (includeStructural && semanticDigest(before) !== semanticDigest(after)) warning = true;

      const beforeByServiceCode = { [code]: before.products };
      const afterByServiceCode = { [code]: after.products };
      for (const sample of reachableCaseIterator(pkg, beforeByServiceCode, before.region)) {
        const caseIndex = seenCases++;
        progressCases += 1;
        batchCases += 1;

        if (caseIndex < caseOffset) {
          emitProgress(false);
          continue;
        }
        if (processedCases >= caseLimit) {
          exhausted = true;
          emitProgress(true);
          break packageLoop;
        }

        if (changedSkuSet && !sample.products.some(product => changedSkuSet.has(product.sku))) {
          processedCases += 1;
          reusedCases += 1;
          emitProgress(false);
          continue;
        }

        const oldResult = evaluateService(
          sample.pkg,
          sample.instance,
          sample.project,
          sample.products,
          sample.profileProducts,
          sample.productsByServiceCode
        );
        const oldComponent = oldResult.components[sample.componentId];
        const oldSku = oldComponent?.resolution?.product?.sku;
        if (changedSkuSet && oldSku && !changedSkuSet.has(oldSku)) {
          processedCases += 1;
          reusedCases += 1;
          emitProgress(false);
          continue;
        }

        const newProducts = afterByServiceCode[code];
        const newResult = evaluateService(
          sample.pkg,
          sample.instance,
          sample.project,
          newProducts,
          newProducts,
          afterByServiceCode
        );
        breaks.push(...newResult.issues.map(issue => ({ ...issue, region: after.region })));
        const next = newResult.components[sample.componentId];
        if (oldComponent?.unitPriceUsd !== next?.unitPriceUsd) {
          rateDiff.push({
            serviceId: pkg.service.id,
            region: after.region,
            componentId: sample.componentId,
            selectors: sample.instance.selectors,
            inputs: sample.instance.components[sample.componentId].inputs,
            previous: oldComponent?.unitPriceUsd,
            current: next?.unitPriceUsd
          });
        }
        processedCases += 1;
        emitProgress(false);
      }
    }
  }
  emitProgress(true);

  return {
    classification: breaks.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !breaks.length,
    issues: breaks,
    rateDiff,
    processedCases,
    seenCases,
    progressCases,
    reusedCases,
    exhausted
  };
}
