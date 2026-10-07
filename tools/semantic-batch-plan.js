#!/usr/bin/env node
import path from 'node:path';
import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { loadCandidateMetadata, writeJson } from './pricing-cli/cli.js';
import { planSemanticBatches } from './pricing-cli/semantic-plan.js';
import {
  effectiveValidationSourceCodes,
  filterPackagesBySourceCodes,
  validationScopeMode
} from './pricing-cli/update-scope.js';

function manifestFromMetadata(metadata) {
  const sources = {};
  for (const source of Object.values(metadata.sources ?? {})) {
    (sources[source.serviceCode] ??= {})[source.region] = {
      ...source,
      productsPath: source.productsPath ?? `sources/${source.serviceCode}/${source.region}/products.json`
    };
  }
  return { sources };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const directory = process.argv[2] ?? '.work/update/candidate';
    const output = process.argv[3] ?? '.work/update/semantic-plan.json';
    const packages = await loadPackages('services');
    const metadata = await loadCandidateMetadata(directory);
    const state = await readJson(path.join(path.dirname(directory), 'prepare-state.json'));
    const sourceCodes = effectiveValidationSourceCodes(state, metadata);
    const scopedPackages = filterPackagesBySourceCodes(packages, sourceCodes);
    if (!scopedPackages.length) throw new Error('Semantic validation scope resolved to no service packages.');
    if (sourceCodes !== null) {
      console.log(`semantic-plan scoped: services=${scopedPackages.map(pkg => pkg.service.id).join(',')} price_sources=${[...sourceCodes].sort().join(',')}`);
    }
    const plan = await planSemanticBatches(scopedPackages, directory, manifestFromMetadata(metadata));
    plan.summary.scope = validationScopeMode(state, sourceCodes);
    plan.summary.scopeServiceIds = scopedPackages.map(pkg => pkg.service.id).sort();
    plan.summary.scopeServiceCodes = sourceCodes === null ? [] : [...sourceCodes].sort();
    await writeJson(output, plan);
    process.stdout.write(`${JSON.stringify(plan.summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
