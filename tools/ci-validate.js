import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { candidateDirectory, run } from './pricing-cli/cli.js';
import { definitionFingerprint } from './pricing-cli/fingerprint.js';
import { changedFiles, validationScope } from './ci-validation-scope.js';
import { appendFile } from 'node:fs/promises';
import { validateRepository } from './validate-repository.js';

const build = await readJson(`${await candidateDirectory()}/build-manifest.json`);
const packages = await loadPackages();
const fingerprint = await definitionFingerprint(packages);

const scope = validationScope({ fingerprintMatches: build.definitionSha256 === fingerprint, files: await changedFiles() });
const planOnly = process.argv.includes('--plan');
console.log(`CI validation scope: ${scope}; active_build=${build.buildId}`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `heavy=${scope === 'published'}\ndirectory=${await candidateDirectory()}\nscope=${scope}\n`);

if (scope !== 'candidate') {
  // Keep Golden and checksum/schema/index/catalog checks for presentation changes.
  // Heavy CI validation runs independently across workflow runners.
  await validateRepository({ semantic: scope === 'published' && !planOnly });
} else {
  // A Definition/normalization change requires rebuilding the remote AWS Price DB.
  // Do not duplicate that large network/build workload in the ordinary application CI:
  // the Scheduled Price Update workflow is triggered by pricing-definition changes and
  // performs candidate generation, semantic/golden/drift validation and publication.
  const result = await run('validate-definitions');
  console.log(`validate-definitions: ${result.status}, errors=${result.summary.error}`);
  if (result.summary.error) {
    console.error(JSON.stringify(result.issues, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Published Price DB fingerprint ${build.definitionSha256 ?? '(none)'} differs from current ${fingerprint}; full candidate validation is delegated to Scheduled Price Update.`);
  }
}
