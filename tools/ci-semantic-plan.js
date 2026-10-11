import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { planSemanticBatches } from './pricing-cli/semantic-plan.js';
import { writeJson } from './pricing-cli/cli.js';

const [directory, output] = process.argv.slice(2);
if (!directory || !output) throw Error('Usage: ci-semantic-plan <published-directory> <plan-file>');
const manifest = await readJson(`${directory}/build-manifest.json`);
const plan = await planSemanticBatches(await loadPackages(), directory, manifest);
plan.summary.scope = 'published';
plan.buildId = manifest.buildId;
await writeJson(output, plan);
console.log(JSON.stringify(plan.summary));
