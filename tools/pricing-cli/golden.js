import { evaluateService } from '../../src/pricing/core.js';
import { decimal, sum } from '../../src/pricing/decimal.js';
import { issue } from '../../src/pricing/issues.js';
import { sourceKey } from './source.js';

export function verifyRawPrice(raw, verification) {
  const candidates = Object.values(raw.products).filter(product => Object.entries(verification.attributes).every(([key, value]) => product.attributes[key] === value) && (!verification.productFamily || product.productFamily === verification.productFamily));
  if (candidates.length !== 1) throw Error(`Independent verifier: ${candidates.length} products`);
  const terms = Object.values(raw.terms.OnDemand[candidates[0].sku] ?? {}).filter(term => term.effectiveDate <= raw.publicationDate);
  const date = terms.map(t => t.effectiveDate).sort().at(-1);
  const active = terms.filter(t => t.effectiveDate === date);
  if (active.length !== 1) throw Error('Independent verifier: ambiguous current term');
  const dimensions = Object.values(active[0].priceDimensions).filter(d => d.unit === verification.unit && (!verification.description || d.description === verification.description));
  const paid = dimensions.filter(d => decimal(d.pricePerUnit.USD).gt('0')).sort((a, b) => decimal(a.beginRange).cmp(b.beginRange));
  if (!paid.length) throw Error('Independent verifier: paid dimension missing');
  if (paid.length > 1 && !paid.every((d, i) => i === 0 || paid[i - 1].endRange === d.beginRange)) throw Error('Independent verifier: heterogeneous dimensions');
  return { unitPriceUsd: decimal(paid[0].pricePerUnit.USD).toString(), amountUsd: decimal(verification.quantity).times(paid[0].pricePerUnit.USD).toString() };
}

function checkResolvedPrice(actual, expected, verification, raw, path) {
  if (actual.resolution.skuCount !== 1 || actual.billingUnit !== expected.unit || actual.billingQuantity !== expected.quantity) throw Error(`${path}: structure/quantity mismatch`);
  for (const [keyName, value] of Object.entries(expected.attributes)) if (actual.resolution.product.attributes[keyName] !== value) throw Error(`${path}: semantic ${keyName} mismatch`);
  for (const id of expected.limitations ?? []) if (!(actual.limitations ?? []).includes(id)) throw Error(`${path}: missing ${id}`);
  const verified = verifyRawPrice(raw, verification);
  if (actual.unitPriceUsd !== verified.unitPriceUsd || actual.amountUsd !== verified.amountUsd) throw Error(`${path}: independent price mismatch`);
  return verified.amountUsd;
}

export function runGolden(packages, data, rawSources) {
  const issues = [], cases = [];
  for (const pkg of packages) {
    const covered = new Set();
    for (const golden of pkg.golden) {
      covered.add(golden.profileId);
      const code = pkg.service.priceSource.serviceCode;
      const region = golden.project?.region ?? golden.project?.defaultRegion ?? 'ap-northeast-1';
      const key = sourceKey(code, region);
      const source = data[key] ?? (data[code]?.region === region || !data[code]?.region ? data[code] : undefined);
      const result = evaluateService(pkg, golden, { ...golden.project, region, defaultRegion: golden.project?.defaultRegion ?? region }, source?.products ?? []);
      try {
        if (result.amountUsd === null) throw Error(JSON.stringify(result.issues));
        const expectedAmounts = [];
        const raw = rawSources[key] ?? rawSources[code];
        if (!raw) throw Error(`Raw source missing for ${key}`);
        for (const [componentId, expected] of Object.entries(golden.expected)) {
          const actual = result.components[componentId];
          if (expected.disabled) { if (actual.state !== 'disabled') throw Error(`${componentId}: expected disabled`); continue; }
          for (const id of expected.limitations ?? []) if (!(actual.limitations ?? []).includes(id)) throw Error(`${componentId}: missing ${id}`);
          if (expected.meters) {
            const verification = golden.verification[componentId]?.meters ?? {};
            for (const [meterId, meterExpected] of Object.entries(expected.meters)) {
              const actualMeter = actual.meters?.[meterId];
              if (!actualMeter) throw Error(`${componentId}/${meterId}: meter missing`);
              if (meterExpected.disabled) { if (actualMeter.state !== 'disabled') throw Error(`${componentId}/${meterId}: expected disabled`); continue; }
              expectedAmounts.push(checkResolvedPrice(actualMeter, meterExpected, verification[meterId], raw, `${componentId}/${meterId}`));
            }
          } else {
            expectedAmounts.push(checkResolvedPrice(actual, expected, golden.verification[componentId], raw, componentId));
          }
        }
        if (!decimal(result.amountUsd).eq(sum(expectedAmounts))) throw Error('Service total mismatch');
        cases.push({ serviceId: pkg.service.id, goldenId: golden.id, region, status: 'passed' });
      } catch (error) { issues.push(issue('GOLDEN_FAILED', error.message, { serviceId: pkg.service.id, profileId: golden.profileId, path: `golden/${golden.id}`, region })); }
    }
    for (const profile of pkg.service.profiles) if (!covered.has(profile)) issues.push(issue('GOLDEN_COVERAGE_MISSING', `No Golden for ${profile}.`, { serviceId: pkg.service.id }));
  }
  return { issues, cases };
}
