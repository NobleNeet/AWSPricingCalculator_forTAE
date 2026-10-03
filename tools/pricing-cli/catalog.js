import { validateDefinitions } from './validate-definitions.js';
import { encode } from './normalize.js';
import { writeFile } from 'node:fs/promises';

export async function generateCatalog(packages, manifest, file = 'services/catalog.json') {
  const issues = await validateDefinitions(packages);
  const services = packages.map(pkg => ({ id: pkg.service.id, label: pkg.service.label, serviceCode: pkg.service.priceSource.serviceCode, profiles: pkg.service.profiles, available: !issues.some(i => i.serviceId === pkg.service.id && i.severity === 'error') && !!manifest.sources[pkg.service.priceSource.serviceCode]?.['ap-northeast-1'] })).sort((a, b) => a.label.localeCompare(b.label));
  await writeFile(file, encode({ schemaVersion: 1, services }));
  return services;
}
