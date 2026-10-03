import { readJson } from './package-loader.js';
import { checksum } from './build.js';
import { encode } from './normalize.js';

export async function definitionFingerprint(packages) {
  const definitions = packages.map(pkg => ({ service: pkg.service, profiles: pkg.profiles, components: pkg.components, coverage: pkg.coverage, golden: pkg.golden }));
  const common = await readJson('pricing/normalization/common.json');
  const normalizers = Object.fromEntries(await Promise.all([...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))].sort().map(async code => [code, await readJson(`pricing/normalization/services/${code}.json`).catch(error => error.code === 'ENOENT' ? { rules: [], discriminators: [] } : Promise.reject(error))])));
  return checksum(encode({ definitions, common, normalizers, limitations: await readJson('pricing/limitations.json') }));
}
