import { evaluateService } from '../../src/pricing/core.js';
import { reachableCases } from './semantics.js';
import { encode } from './normalize.js';

function semantic(data) {
  return data.products.map(p => ({ ...p, terms: { onDemand: p.terms.onDemand.map(t => ({ ...t, effectiveDate: undefined, priceDimensions: t.priceDimensions.map(d => ({ ...d, pricePerUnit: undefined })) })) } }));
}
export function classifyChange(packages, previous, candidate, candidateIssues = []) {
  const breaks = candidateIssues.filter(i => i.severity === 'error');
  let warning = false;
  const rateDiff = [];
  for (const pkg of packages) {
    const code = pkg.service.priceSource.serviceCode;
    const keys = new Set([
      ...Object.entries(previous).filter(([, source]) => source.serviceCode === code).map(([key]) => key),
      ...Object.entries(candidate).filter(([, source]) => source.serviceCode === code).map(([key]) => key)
    ]);
    if (!keys.size) { warning = true; continue; }
    for (const key of keys) {
      const before = previous[key], after = candidate[key];
      if (!before || !after) { warning = true; continue; }
      if (encode(semantic(before)) !== encode(semantic(after))) warning = true;
      for (const sample of reachableCases(pkg, before.products, before.region)) {
        const oldResult = evaluateService(sample.pkg, sample.instance, sample.project, before.products);
        const newResult = evaluateService(sample.pkg, sample.instance, sample.project, after.products);
        breaks.push(...newResult.issues.map(issue => ({ ...issue, region: after.region })));
        const oldComponent = oldResult.components[sample.componentId], next = newResult.components[sample.componentId];
        if (oldComponent?.unitPriceUsd !== next?.unitPriceUsd) rateDiff.push({ serviceId: pkg.service.id, region: after.region, componentId: sample.componentId, selectors: sample.instance.selectors, inputs: sample.instance.components[sample.componentId].inputs, previous: oldComponent?.unitPriceUsd, current: next?.unitPriceUsd });
      }
    }
  }
  return { classification: breaks.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY', publishable: !breaks.length, issues: breaks, rateDiff };
}
