import path from 'node:path';
import { loadCandidate, writeJson } from './pricing-cli/cli.js';
import { readJson } from './pricing-cli/package-loader.js';
import { sourceKey } from './pricing-cli/source.js';
import { evaluateService } from '../src/pricing/core.js';
import { priceSourceForComponent } from '../src/pricing/mapping.js';

function matchesVerification(product, verification) {
  return Object.entries(verification.attributes ?? {}).every(([key, value]) => product.attributes?.[key] === value)
    && (!verification.productFamily || product.productFamily === verification.productFamily);
}

function addRawSku(sample, raw, sku) {
  const product = raw.products?.[sku];
  const terms = raw.terms?.OnDemand?.[sku];
  if (!product || !terms) return false;
  sample.products[sku] = product;
  sample.terms.OnDemand[sku] = terms;
  return true;
}

export async function readGoldenRawSource(rawDirectory, code, region, fixtureDirectory = 'tests/fixtures/aws') {
  const candidates = [
    path.join(rawDirectory, code, `${region}.json`),
    path.join(fixtureDirectory, code, `${region}.json`),
    path.join(fixtureDirectory, `${code}.json`)
  ];
  let missing;
  for (const file of candidates) {
    try {
      return await readJson(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      missing = error;
    }
  }
  throw missing ?? new Error(`Golden raw source missing for ${code}/${region}`);
}

export async function refreshGoldenEvidenceTolerant(packages, rawDirectory, output, candidateDirectoryPath) {
  if (!candidateDirectoryPath) throw new Error('Golden evidence requires a normalized candidate directory');
  const candidate = await loadCandidate(candidateDirectoryPath);
  const groups = new Map();
  const sourceFor = (code, region) => candidate.data[sourceKey(code, region)]
    ?? (candidate.data[code]?.region === region || !candidate.data[code]?.region ? candidate.data[code] : undefined);

  for (const pkg of packages) for (const golden of pkg.golden) {
    const defaultCode = pkg.service.priceSource.serviceCode;
    const region = golden.project?.region ?? golden.project?.defaultRegion ?? 'ap-northeast-1';
    const source = sourceFor(defaultCode, region);
    if (!source) throw new Error(`Golden evidence ${defaultCode}/${region}: normalized source missing`);
    const codes = [...new Set([defaultCode, ...Object.keys(golden.verification).map(id => priceSourceForComponent(pkg, id))])];
    const productsByCode = Object.fromEntries(codes.map(code => {
      const data = sourceFor(code, region);
      if (!data) throw new Error(`Golden evidence ${code}/${region}: normalized source missing`);
      return [code, data.products ?? []];
    }));
    const result = evaluateService(pkg, golden, { ...golden.project, region, defaultRegion: golden.project?.defaultRegion ?? region }, source.products ?? [], source.products ?? [], productsByCode);
    for (const [componentId, verification] of Object.entries(golden.verification)) {
      const code = priceSourceForComponent(pkg, componentId);
      const key = sourceKey(code, region);
      const group = groups.get(key) ?? { code, region, entries: [] };
      group.entries.push({ resolvedSku: result.components[componentId]?.resolution?.product?.sku, verification });
      groups.set(key, group);
    }
  }

  for (const { code, region, entries } of groups.values()) {
    const raw = await readGoldenRawSource(rawDirectory, code, region);
    const sample = { offerCode: raw.offerCode, version: raw.version, publicationDate: raw.publicationDate, products: {}, terms: { OnDemand: {} } };
    for (const { resolvedSku, verification } of entries) {
      if (resolvedSku && addRawSku(sample, raw, resolvedSku)) continue;
      // Keep ambiguous candidates so subsequent validation reports the real mismatch.
      for (const product of Object.values(raw.products ?? {})) {
        if (matchesVerification(product, verification)) addRawSku(sample, raw, product.sku);
      }
    }
    await writeJson(path.join(output, code, `${region}.json`), sample);
  }
}
