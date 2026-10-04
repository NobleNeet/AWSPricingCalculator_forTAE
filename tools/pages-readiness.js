import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { candidateDirectory } from './pricing-cli/cli.js';
import { definitionFingerprint } from './pricing-cli/fingerprint.js';
import { appendFile } from 'node:fs/promises';

const build = await readJson(`${await candidateDirectory()}/build-manifest.json`);
const packages = await loadPackages();
const fingerprint = await definitionFingerprint(packages);
const ready = build.definitionSha256 === fingerprint;

console.log(`Pages readiness: ${ready ? 'ready' : 'deferred'}`);
console.log(`Published Price DB fingerprint: ${build.definitionSha256 ?? '(none)'}`);
console.log(`Current Definition fingerprint: ${fingerprint}`);
if (!ready) {
  console.log('Pages deployment is deferred until Scheduled Price Update publishes a Price DB built from the current Definition set.');
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `ready=${ready}\n`);
}
