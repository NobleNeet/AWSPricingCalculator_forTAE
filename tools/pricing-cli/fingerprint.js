import { readFile } from 'node:fs/promises';
import { readJson } from './package-loader.js';
import { checksum } from './hash.js';

export const SEMANTIC_CONTRACT_VERSION = 2;

function stableFingerprint(value) {
  if (Array.isArray(value)) return value.map(stableFingerprint);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, stableFingerprint(value[key])])
    );
  }
  return value;
}

function fingerprintEncode(value) {
  return `${JSON.stringify(stableFingerprint(value), null, 2)}\n`;
}

// These files can change how a normalized AWS product is interpreted, matched,
// validated, or evaluated. Build/publish/orchestration files intentionally do
// not belong here.
export const PRICING_CONTRACT_FILES = [
  'src/pricing/calculation.js',
  'src/pricing/conditions.js',
  'src/pricing/core.js',
  'src/pricing/decimal.js',
  'src/pricing/dimensions.js',
  'src/pricing/filter.js',
  'src/pricing/issues.js',
  'src/pricing/mapping.js',
  'src/pricing/price-query.js',
  'tools/pricing-cli/hash.js',
  'tools/pricing-cli/inventory.js',
  'tools/pricing-cli/normalize.js',
  'tools/pricing-cli/package-loader.js',
  'tools/pricing-cli/product-chunks.js',
  'tools/pricing-cli/semantic-json.js',
  'tools/pricing-cli/semantic-parallel.js',
  'tools/pricing-cli/semantic-validation-worker.js',
  'tools/pricing-cli/semantics.js',
  'tools/schema.js',
  'schemas/pricing/products.schema.json'
];

export const PUBLICATION_CONTRACT_FILES = [
  'tools/pricing-cli/build.js',
  'tools/pricing-cli/hash.js',
  'tools/pricing-cli/encoding.js',
  'tools/pricing-cli/price-index.js',
  'tools/pricing-cli/product-chunk-writer.js',
  'tools/pricing-cli/publication-candidate.js',
  'tools/publish-price-build.js',
  'schemas/pricing/build-manifest.schema.json'
];

// PR #43's final full validation published this exact v1 semantic baseline.
// v2 narrows the fingerprint to semantic inputs only. Treating this known
// baseline as compatible avoids one more EC2-scale full validation solely for
// the fingerprint-boundary migration. Any other unknown v1 baseline fails safe.
export const COMPATIBLE_SEMANTIC_MIGRATIONS = new Map([
  [
    'b253ce3d9e872d068ac10c7aa44a45d34ebe5dfed4ffef42cba100fc42ba3385',
    '40ca156ff3ad83a80ee75bb29eaa26d5ccc96d361b1252921a607344930b925e'
  ]
]);

export function semanticGlobalChanged(previous, current) {
  if (!previous || typeof previous.global !== 'string') return true;
  if (previous.schemaVersion === current.schemaVersion) return previous.global !== current.global;
  if (
    previous.schemaVersion === 1
    && current.schemaVersion === SEMANTIC_CONTRACT_VERSION
    && COMPATIBLE_SEMANTIC_MIGRATIONS.get(previous.global) === current.global
  ) return false;
  return true;
}

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
  return checksum(fingerprintEncode({
    common: await readJson('pricing/normalization/common.json'),
    limitations: await readJson('pricing/limitations.json'),
    pricingContract
  }));
}

export async function publicationContractFingerprint() {
  const publicationContract = Object.fromEntries(await Promise.all(
    PUBLICATION_CONTRACT_FILES.map(async file => [file, await readFile(file, 'utf8')])
  ));
  return checksum(fingerprintEncode({ publicationContract }));
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
    return [pkg.service.id, checksum(fingerprintEncode(value))];
  }));
  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
}

export async function contractFingerprints(packages) {
  return {
    schemaVersion: SEMANTIC_CONTRACT_VERSION,
    global: await pricingContractFingerprint(),
    services: await serviceDefinitionFingerprints(packages)
  };
}

export function changedPriceSourceCodes(packages, previous, current) {
  if (!previous || typeof previous.global !== 'string' || !previous.services) {
    return new Set(packages.flatMap(packagePriceSourceCodes));
  }
  if (semanticGlobalChanged(previous, current)) {
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
  return checksum(fingerprintEncode(contracts));
}
