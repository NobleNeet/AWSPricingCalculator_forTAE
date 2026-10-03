import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { candidateDirectory } from './pricing-cli/cli.js';
import { definitionFingerprint } from './pricing-cli/fingerprint.js';
import { priceUpdate } from './price-update.js';

const build = await readJson(`${await candidateDirectory()}/build-manifest.json`);
if (build.definitionSha256 === await definitionFingerprint(await loadPackages())) {
  // Application-only PRs validate the pinned published data entirely offline.
  await import('./validate-repository.js');
} else {
  // New/changed Definitions validate a complete temporary candidate. Promotion
  // is intentionally absent from this read-only CI path.
  const result = await priceUpdate({ work: '.work/ci' });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'VALIDATED' || !result.publishable) process.exitCode = 1;
}
