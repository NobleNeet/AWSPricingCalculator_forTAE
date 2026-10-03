// Promotion is separate from the Pricing CLI. Only this repository operation
// may move the active manifest; validation/build commands never do.
import { readFile, readdir, mkdir, cp, rm, writeFile, rename, access } from 'node:fs/promises';
import path from 'node:path';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { checksum } from './pricing-cli/build.js';
import { encode } from './pricing-cli/normalize.js';
import { schemaValidator } from './schema.js';
import { generateCatalog } from './pricing-cli/catalog.js';

export async function promoteBuild({ stage, reports, generated = 'pricing/generated', expectedPrevious, catalogFile = 'services/catalog.json', fixtureDirectory = 'tests/fixtures/aws', packages } = {}) {
  const summary = await readJson(path.join(reports, 'summary.json'));
  if (!summary.publishable || summary.status !== 'VALIDATED' || !['PRICE_ONLY', 'STRUCTURE_WARNING'].includes(summary.classification)) throw Error('Publish rejected: validation or STRUCTURE_BREAKING');
  for (const command of ['validate-definitions', 'validate-price-data', 'run-golden', 'classify-change', 'build']) {
    const result = await readJson(path.join(reports, `${command}.json`));
    if (result.status !== 'passed' || result.summary.error !== 0 || result.issues.some(i => i.severity === 'error')) throw Error(`Publish rejected: ${command}`);
  }
  const classification = await readJson(path.join(reports, 'classify-change.json'));
  if (!classification.publishable || classification.classification !== summary.classification) throw Error('Publish classification proof mismatch');
  const active = await readJson(path.join(generated, 'manifest.json'));
  if (active.activeBuildId !== (expectedPrevious ?? summary.previousBuildId)) throw Error('Active build changed while candidate was prepared');
  if (!/^[a-zA-Z0-9-]+$/.test(summary.buildId)) throw Error('Invalid build ID');
  const root = path.join(stage, 'pricing/builds', summary.buildId);
  const text = await readFile(path.join(root, 'build-manifest.json'), 'utf8');
  if (checksum(text) !== summary.buildManifestSha256) throw Error('Build proof checksum mismatch');
  const manifest = JSON.parse(text);
  const validateManifest = await schemaValidator('pricing/build-manifest');
  if (!validateManifest(manifest) || manifest.buildId !== summary.buildId) throw Error('Invalid build manifest');
  for (const [code, regions] of Object.entries(manifest.sources)) for (const [region, source] of Object.entries(regions)) {
    for (const [kind, name] of [['products', 'sources'], ['index', 'indexes']]) {
      const relative = source[`${kind}Path`];
      if (relative !== `${name}/${code}/${region}/${kind}.json`) throw Error('Unsafe resource path');
      const resource = await readFile(path.join(root, relative), 'utf8');
      if (checksum(resource) !== source[`${kind}Sha256`] || Buffer.byteLength(resource) !== source[`${kind}Bytes`]) throw Error('Build resource checksum mismatch');
      const data = JSON.parse(resource), validate = await schemaValidator(`pricing/${kind}`);
      if (!validate(data) || data.buildId !== manifest.buildId || data.serviceCode !== code || data.region !== region) throw Error('Build resource schema/identity mismatch');
    }
  }
  const destination = path.join(generated, 'builds', summary.buildId);
  try { await access(destination); throw Error('Immutable build already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await cp(root, destination, { recursive: true, errorOnExist: true, force: false });
  // Keep the candidate and currently active build until the final manifest commit point.
  for (const entry of await readdir(path.join(generated, 'builds'), { withFileTypes: true })) if (entry.isDirectory() && entry.name !== summary.buildId && entry.name !== active.activeBuildId && /^[a-zA-Z0-9-]+$/.test(entry.name)) await rm(path.join(generated, 'builds', entry.name), { recursive: true });
  if (fixtureDirectory) { await mkdir(fixtureDirectory, { recursive: true }); await cp(path.join(stage, 'fixtures'), fixtureDirectory, { recursive: true }); }
  await generateCatalog(packages ?? await loadPackages(), manifest, catalogFile);
  const temp = path.join(generated, `manifest-${summary.buildId}.tmp`);
  await writeFile(temp, encode({ schemaVersion: 1, activeBuildId: manifest.buildId, publicationDate: manifest.publicationDate }));
  await rename(temp, path.join(generated, 'manifest.json'));
  return { activeBuildId: manifest.buildId, previousBuildId: active.activeBuildId };
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const work = process.argv[2] ?? '.work/update';
  try { process.stdout.write(`${JSON.stringify(await promoteBuild({ stage: path.join(work, 'staged'), reports: path.join(work, 'reports') }))}\n`); }
  catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }
}
