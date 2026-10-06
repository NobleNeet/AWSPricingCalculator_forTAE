import path from 'node:path';
import { loadCandidate, writeJson } from './pricing-cli/cli.js';
import { readJson } from './pricing-cli/package-loader.js';
import { sourceKey } from './pricing-cli/source.js';
import { evaluateService } from '../src/pricing/core.js';

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

  for (const pkg of packages) for (const golden of pkg.golden) {
    const code = pkg.service.priceSource.serviceCode;
    const region = golden.project?.region ?? golden.project?.defaultRegion ?? 'ap-northeast-1';
    const key = sourceKey(code, region);
    const group = groups.get(key) ?? { code, region, entries: [] };
    group.entries.push({ pkg, golden });
    groups.set(key, group);
  }

  for (const { code, region, entries } of groups.values()) {
    const raw = await readGoldenRawSource(rawDirectory, code, region);

    const key = sourceKey(code, region);
    const source = candidate.data[key] ?? (candidate.data[code]?.region === region || !candidate.data[code]?.region ? candidate.data[code] : undefined);
    if (!source) throw new Error(`Golden evidence ${code}/${region}: normalized source missing`);

    const sample = {
      offerCode: raw.offerCode,
      version: raw.version,
      publicationDate: raw.publicationDate,
      products: {},
      terms: { OnDemand: {} }
    };

    for (const { pkg, golden } of entries) {
      const result = evaluateService(
        pkg,
        golden,
        { ...golden.project, region, defaultRegion: golden.project?.defaultRegion ?? region },
        source.products ?? []
      );

      for (const [componentId, verification] of Object.entries(golden.verification)) {
        const resolvedSku = result.components[componentId]?.resolution?.product?.sku;
        if (resolvedSku && addRawSku(sample, raw, resolvedSku)) continue;

        // Prepare must not pre-empt semantic validation. If the Definition cannot yet
        // resolve one SKU, preserve every raw candidate matching the independent Golden
        // verification. finalize/run-golden will then report the real ambiguity/miss.
        for (const product of Object.values(raw.products ?? {})) {
          if (matchesVerification(product, verification)) addRawSku(sample, raw, product.sku);
        }
      }
    }

    await writeJson(path.join(output, code, `${region}.json`), sample);
  }
}
