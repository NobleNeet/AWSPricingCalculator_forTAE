#!/usr/bin/env node
import { loadPackages } from './pricing-cli/package-loader.js';
import { loadCandidateMetadata, writeJson } from './pricing-cli/cli.js';
import { planSemanticBatches } from './pricing-cli/semantic-plan.js';

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
    const plan = await planSemanticBatches(packages, directory, manifestFromMetadata(metadata));
    await writeJson(output, plan);
    process.stdout.write(`${JSON.stringify(plan.summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
