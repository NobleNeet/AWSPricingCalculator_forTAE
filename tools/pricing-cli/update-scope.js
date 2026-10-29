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
  if (state.reuseSemanticBaseline === true) return new Set();

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
  if (sourceCodes.size === 0 && state.reuseSemanticBaseline === true) return 'reuse';
  if ((state.requestedScopeServiceIds ?? []).length) return 'onboarding';
  return 'incremental';
}

export function filterPackagesBySourceCodes(packages, sourceCodes) {
  if (sourceCodes === null) return packages;
  return packages.filter(pkg =>
    packagePriceSourceCodes(pkg).some(code => sourceCodes.has(code))
  );
}

/**
 * The active published Price DB contains only selected SKUs, not the full AWS
 * source catalogue. If one source changes, semantic validation also executes
 * other mappings of affected service packages. Rehydrate those companion
 * sources from their pinned AWS versions instead of treating the pruned
 * published subset as complete source evidence.
 *
 * This expands downloads only; awsChanged must remain the actual AWS result
 * so unchanged companion sources do not broaden semantic validation to
 * unrelated packages.
 */
export function refreshCompanionSources(packages, metadata) {
  const changedCodes = new Set(Object.values(metadata.sources ?? {})
    .filter(source => source.changed === true)
    .map(source => source.serviceCode));
  if (!changedCodes.size) return [];
  const companionCodes = new Set();
  for (const pkg of packages) {
    const codes = packagePriceSourceCodes(pkg);
    if (codes.some(code => changedCodes.has(code))) {
      for (const code of codes) companionCodes.add(code);
    }
  }
  const refreshed = [];
  for (const [key, source] of Object.entries(metadata.sources ?? {})) {
    if (companionCodes.has(source.serviceCode) && !source.changed) {
      source.changed = true;
      refreshed.push(key);
    }
  }
  return refreshed.sort();
}
