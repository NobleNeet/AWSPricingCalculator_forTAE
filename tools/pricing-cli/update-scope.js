import path from 'node:path';
import { packagePriceSourceCodes } from './fingerprint.js';

export function parseRequestedServiceIds(value = '') {
  return [...new Set(String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean))].sort();
}

export function resolveRequestedValidationScope(packages, rawServiceIds = '') {
  const serviceIds = parseRequestedServiceIds(rawServiceIds);
  if (!serviceIds.length) return { serviceIds: [], serviceCodes: [] };

  const byId = new Map(packages.map(pkg => [
    pkg.service?.id ?? path.basename(pkg.directory ?? ''),
    pkg
  ]));
  const missing = serviceIds.filter(id => !byId.has(id));
  if (missing.length) throw new Error(`Unknown validation scope service id(s): ${missing.join(', ')}`);

  const serviceCodes = [...new Set(serviceIds.flatMap(id => packagePriceSourceCodes(byId.get(id))))].sort();
  if (!serviceCodes.length) throw new Error('Scoped validation resolved to no AWS Price List service codes.');
  return { serviceIds, serviceCodes };
}

export function effectiveValidationSourceCodes(state, metadata) {
  // A real global semantic-contract change invalidates reuse for every service.
  // Build/publication-only changes are deliberately excluded from this flag.
  if (state.globalContractChanged === true) return null;

  const codes = new Set([
    ...(state.requestedScopeServiceCodes ?? []),
    ...(state.definitionRefreshServiceCodes ?? [])
  ]);
  for (const source of Object.values(metadata.sources ?? {})) {
    const awsChanged = source.awsChanged === true
      || (source.awsChanged == null && source.changed === true);
    if (awsChanged && source.serviceCode) codes.add(source.serviceCode);
  }

  // Normal scheduled/push runs are incremental too: only sources whose AWS data
  // or service Definition changed need expensive semantic revalidation.
  if (codes.size) return codes;

  // Compatibility/fail-safe for callers without prepared change metadata.
  return null;
}

export function validationScopeMode(state, sourceCodes) {
  if (sourceCodes === null) return 'all';
  if ((state.requestedScopeServiceIds ?? []).length) return 'onboarding';
  return 'incremental';
}

export function filterPackagesBySourceCodes(packages, sourceCodes) {
  if (sourceCodes === null) return packages;
  return packages.filter(pkg =>
    packagePriceSourceCodes(pkg).some(code => sourceCodes.has(code))
  );
}
