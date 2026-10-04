import { parentPort, workerData } from 'node:worker_threads';
import path from 'node:path';
import { loadPackages, readJson } from './package-loader.js';
import { validatePriceData } from './semantics.js';

async function main() {
  const { serviceCode, serviceIds, directory, sources } = workerData;
  const packages = (await loadPackages()).filter(pkg => serviceIds.includes(pkg.service.id));
  const data = {};

  for (const source of sources) {
    data[`${serviceCode}/${source.region}`] = await readJson(path.join(directory, source.productsPath));
  }

  const common = await readJson('pricing/normalization/common.json');
  const normalizer = await readJson(`pricing/normalization/services/${serviceCode}.json`).catch(error => {
    if (error.code === 'ENOENT') return { rules: [], discriminators: [] };
    throw error;
  });
  const checked = validatePriceData(packages, data, common, { [serviceCode]: normalizer });

  parentPort.postMessage({
    serviceCode,
    issues: checked.issues,
    coverage: checked.coverage,
    branches: checked.resolutions.length
  });
}

main().catch(error => {
  parentPort.postMessage({ serviceCode: workerData.serviceCode, error: error.stack ?? error.message });
});
