// Promotion is separate from the Pricing CLI. Only this repository operation
// may move the active manifest; validation/build commands never do.
import { readFile, readdir, mkdir, cp, rm, writeFile, rename, access, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { checksum } from './pricing-cli/build.js';
import { encode } from './pricing-cli/normalize.js';
import { schemaValidator } from './schema.js';
import { generateCatalog } from './pricing-cli/catalog.js';

function normalizeBuildIdentity(value) {
  if (Array.isArray(value)) return value.map(normalizeBuildIdentity);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    key === 'buildId' ? '__BUILD_ID__' : normalizeBuildIdentity(item)
  ]));
}

function comparableManifest(manifest) {
  const normalized = normalizeBuildIdentity(manifest);
  delete normalized.generatedAt;
  for (const regions of Object.values(normalized.sources ?? {})) {
    for (const source of Object.values(regions ?? {})) {
      delete source.productsSha256;
      delete source.indexSha256;
      delete source.productsBytes;
      delete source.indexBytes;
    }
  }
  return normalized;
}

async function sameBuildContent(candidateRoot, candidateManifest, activeRoot, activeManifest) {
  if (encode(comparableManifest(candidateManifest)) !== encode(comparableManifest(activeManifest))) return false;
  for (const [code, regions] of Object.entries(candidateManifest.sources)) for (const [region, candidateSource] of Object.entries(regions)) {
    const activeSource = activeManifest.sources?.[code]?.[region];
    if (!activeSource) return false;
    for (const kind of ['products', 'index']) {
      const pathKey = `${kind}Path`, shaKey = `${kind}Sha256`, bytesKey = `${kind}Bytes`;
      if (candidateSource[pathKey] !== activeSource[pathKey]) return false;
      const candidateText = await readFile(path.join(candidateRoot, candidateSource[pathKey]), 'utf8');
      const activeText = await readFile(path.join(activeRoot, activeSource[pathKey]), 'utf8');
      if (checksum(activeText) !== activeSource[shaKey] || Buffer.byteLength(activeText) !== activeSource[bytesKey]) {
        throw Error(`Active ${kind} resource checksum mismatch for ${code}/${region}`);
      }
      const candidateData = normalizeBuildIdentity(JSON.parse(candidateText));
      const activeData = normalizeBuildIdentity(JSON.parse(activeText));
      if (encode(candidateData) !== encode(activeData)) return false;
    }
  }
  return true;
}

export async function promoteBuild({ stage, reports, generated = 'pricing/generated', expectedPrevious, catalogFile = 'services/catalog.json', fixtureDirectory = 'tests/fixtures/aws', packages } = {}) {
  const summary = await readJson(path.join(reports, 'summary.json'));
  if (!summary.publishable || summary.status !== 'VALIDATED' || !['PRICE_ONLY', 'STRUCTURE_WARNING'].includes(summary.classification)) throw Error('Publish rejected: validation or STRUCTURE_BREAKING');
  for (const command of ['validate-definitions', 'validate-price-data', 'run-golden', 'classify-change', 'build']) {
    const result = await readJson(path.join(reports, `${command}.json`));
    if (result.status !== 'passed' || result.summary.error !== 0 || result.issues.some(i => i.severity === 'error')) throw Error(`Publish rejected: ${command}`);
  }
  const classification = await readJson(path.join(reports, 'classify-change.json'));
  if (!classification.publishable || classification.classification !== summary.classification) throw Error('Publish classification proof mismatch');
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

  const active = await readJson(path.join(generated, 'manifest.json'));
  const previousBuildId = expectedPrevious ?? summary.previousBuildId;
  if (active.activeBuildId === summary.buildId) {
    const publishedManifestText = await readFile(path.join(generated, 'builds', summary.buildId, 'build-manifest.json'), 'utf8');
    if (checksum(publishedManifestText) !== summary.buildManifestSha256) throw Error('Active build ID matches candidate but published build proof differs');
    console.log(`publication: build ${summary.buildId} is already active; treating promotion as idempotent success`);
    return { activeBuildId: summary.buildId, previousBuildId, alreadyPublished: true };
  }

  if (active.activeBuildId !== previousBuildId) {
    const activeRoot = path.join(generated, 'builds', active.activeBuildId);
    const activeManifest = await readJson(path.join(activeRoot, 'build-manifest.json'));
    if (await sameBuildContent(root, manifest, activeRoot, activeManifest)) {
      console.log(`publication: candidate ${summary.buildId} is content-identical to active build ${active.activeBuildId}; treating promotion as idempotent success`);
      return { activeBuildId: active.activeBuildId, previousBuildId, alreadyPublished: true, equivalentCandidateBuildId: summary.buildId };
    }
    throw Error('Active build changed while candidate was prepared');
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
  return { activeBuildId: manifest.buildId, previousBuildId: active.activeBuildId, alreadyPublished: false };
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const work = process.argv[2] ?? '.work/update';
  try {
    const result = await promoteBuild({ stage: path.join(work, 'staged'), reports: path.join(work, 'reports') });
    if (process.env.GITHUB_ENV) {
      await appendFile(process.env.GITHUB_ENV, `PRICE_VALIDATE_PREVALIDATED=true\nPRICE_VALIDATE_EXPECTED_BUILD_ID=${result.activeBuildId}\n`);
      console.log(`publication-validation: semantic/golden proof already verified for build ${result.activeBuildId}`);
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
  catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }
}
