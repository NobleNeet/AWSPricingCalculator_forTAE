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

export async function definitionFingerprint(packages) {
  const definitions = packages.map(pkg => ({ service: pkg.service, profiles: pkg.profiles, components: pkg.components, coverage: pkg.coverage, golden: pkg.golden }));
  const common = await readJson('pricing/normalization/common.json');
  const normalizers = Object.fromEntries(await Promise.all([...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))].sort().map(async code => [code, await readJson(`pricing/normalization/services/${code}.json`).catch(error => error.code === 'ENOENT' ? { rules: [], discriminators: [] } : Promise.reject(error))])));
  const pricingContract = Object.fromEntries(await Promise.all(PRICING_CONTRACT_FILES.map(async file => [file, await readFile(file, 'utf8')])));
  return checksum(encode({ definitions, common, normalizers, limitations: await readJson('pricing/limitations.json'), pricingContract }));
}
