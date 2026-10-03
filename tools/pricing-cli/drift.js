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
    if (!previous[code] || !candidate[code]) { warning = true; continue; }
    if (encode(semantic(previous[code])) !== encode(semantic(candidate[code]))) warning = true;
    for (const sample of reachableCases(pkg, previous[code].products)) {
      const oldResult = evaluateService(sample.pkg, sample.instance, sample.project, previous[code].products);
      const newResult = evaluateService(sample.pkg, sample.instance, sample.project, candidate[code].products);
      breaks.push(...newResult.issues);
      const oldComponent = oldResult.components[sample.componentId], next = newResult.components[sample.componentId];
      if (oldComponent?.unitPriceUsd !== next?.unitPriceUsd) rateDiff.push({ serviceId: pkg.service.id, componentId: sample.componentId, selectors: sample.instance.selectors, inputs: sample.instance.components[sample.componentId].inputs, previous: oldComponent?.unitPriceUsd, current: next?.unitPriceUsd });
    }
  }
  return { classification: breaks.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY', publishable: !breaks.length, issues: breaks, rateDiff };
}
