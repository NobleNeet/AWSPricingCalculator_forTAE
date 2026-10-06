import { readFile } from 'node:fs/promises';
import { readJson } from './package-loader.js';
import { checksum } from './build.js';
import { encode } from './normalize.js';

export const PRICING_CONTRACT_FILES = [
  'src/pricing/calculation.js',
  'src/pricing/conditions.js',
  'src/pricing/core.js',
  'src/pricing/dimensions.js',
  'src/pricing/filter.js',
  'src/pricing/price-query.js',
  'tools/pricing-cli/build.js',
  'tools/pricing-cli/cli.js',
  'tools/pricing-cli/normalize.js',
  'tools/pricing-cli/semantics.js'
];

async function serviceNormalizer(serviceCode) {
  return readJson(`pricing/normalization/services/${serviceCode}.json`).catch(error =>
    error.code === 'ENOENT' ? { rules: [], discriminators: [] } : Promise.reject(error)
  );
}

export function packagePriceSourceCodes(pkg) {
  return [...new Set([
    pkg.service.priceSource.serviceCode,
    ...Object.values(pkg.service.priceSource.componentOverrides ?? {}),
    ...Object.values(pkg.pricingMappings ?? {}).map(mapping => mapping.priceSource?.serviceCode).filter(Boolean)
  ])].sort();
}

export async function pricingContractFingerprint() {
  const pricingContract = Object.fromEntries(await Promise.all(
    PRICING_CONTRACT_FILES.map(async file => [file, await readFile(file, 'utf8')])
  ));
  return checksum(encode({
    common: await readJson('pricing/normalization/common.json'),
    limitations: await readJson('pricing/limitations.json'),
    pricingContract
  }));
}

export async function serviceDefinitionFingerprints(packages) {
  const entries = await Promise.all(packages.map(async pkg => {
    const sourceCodes = packagePriceSourceCodes(pkg);
    const normalizers = Object.fromEntries(await Promise.all(
      sourceCodes.map(async code => [code, await serviceNormalizer(code)])
    ));
    const value = {
      service: pkg.service,
      profiles: pkg.profiles,
      components: pkg.components,
      pricingMappings: pkg.pricingMappings ?? {},
      coverage: pkg.coverage,
      golden: pkg.golden,
      normalizers
    };
    return [pkg.service.id, checksum(encode(value))];
  }));
  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
}

export async function contractFingerprints(packages) {
  return {
    schemaVersion: 1,
    global: await pricingContractFingerprint(),
    services: await serviceDefinitionFingerprints(packages)
  };
}

export function changedPriceSourceCodes(packages, previous, current) {
  if (!previous || previous.schemaVersion !== 1 || typeof previous.global !== 'string' || !previous.services) {
    return new Set(packages.flatMap(packagePriceSourceCodes));
  }
  if (previous.global !== current.global) {
    return new Set(packages.flatMap(packagePriceSourceCodes));
  }

  const previousServices = previous.services ?? {};
  const currentServices = current.services ?? {};
  const changedServiceIds = new Set([
    ...Object.keys(previousServices).filter(id => previousServices[id] !== currentServices[id]),
    ...Object.keys(currentServices).filter(id => previousServices[id] !== currentServices[id])
  ]);

  const affected = new Set();
  for (const pkg of packages) {
    if (changedServiceIds.has(pkg.service.id)) {
      for (const code of packagePriceSourceCodes(pkg)) affected.add(code);
    }
  }

  // A removed service cannot be reconstructed from current packages. Fail safe:
  // if its fingerprint disappeared, refresh every current price source.
  if (Object.keys(previousServices).some(id => !(id in currentServices))) {
    return new Set(packages.flatMap(packagePriceSourceCodes));
  }
  return affected;
}

export async function definitionFingerprint(packages) {
  const contracts = await contractFingerprints(packages);
  return checksum(encode(contracts));
}
