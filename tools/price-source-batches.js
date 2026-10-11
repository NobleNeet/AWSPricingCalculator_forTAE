import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { writeJson } from './pricing-cli/cli.js';
import { downloadSources, sourceKey } from './pricing-cli/source.js';
import { normalizeIsolated } from './pricing-cli/normalize-isolated.js';
import { priceSourceForComponent } from '../src/pricing/mapping.js';
import { checksum } from './pricing-cli/hash.js';
import { encode } from './pricing-cli/encoding.js';

export function sourceDownloadMatrix(metadata) {
  const include = Object.entries(metadata.sources).filter(([, source]) => source.changed).sort(([a], [b]) => a.localeCompare(b)).map(([key, source], index) => {
    if (key !== sourceKey(source.serviceCode, source.region) || !/^[A-Za-z0-9-]+$/.test(source.serviceCode) || !/^[a-z0-9-]+$/.test(source.region)) throw Error(`Invalid source key: ${key}`);
    return { source_id: String(index).padStart(4, '0'), source_key: key };
  });
  if (include.length > 240) throw Error('Source download plan exceeds workflow matrix limit');
  return { include };
}

// Keep raw AWS evidence only for Golden verification assertions. Resolved
// products outside these assertions must fail Golden rather than reuse old data.
export function goldenSourceEvidence(packages, source, raw) {
  const verifications = packages.flatMap(pkg => pkg.golden.flatMap(golden => {
    const region = golden.project?.region ?? golden.project?.defaultRegion ?? 'ap-northeast-1';
    if (region !== source.region) return [];
    return Object.entries(golden.verification).filter(([id]) => priceSourceForComponent(pkg, id) === source.serviceCode).map(([, verification]) => verification);
  }));
  if (!verifications.length) return null;
  const sample = { offerCode: raw.offerCode, version: raw.version, publicationDate: raw.publicationDate, products: {}, terms: { OnDemand: {} } };
  for (const [sku, product] of Object.entries(raw.products ?? {})) {
    if (!verifications.some(v => (!v.productFamily || product.productFamily === v.productFamily) && Object.entries(v.attributes ?? {}).every(([key, value]) => product.attributes?.[key] === value))) continue;
    if (!raw.terms?.OnDemand?.[sku]) continue;
    sample.products[sku] = product;
    sample.terms.OnDemand[sku] = raw.terms.OnDemand[sku];
  }
  return sample;
}

async function fileChecksum(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function filesUnder(root, relative) {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, name));
    else if (entry.isFile()) files.push(name);
    else throw Error('Unexpected source artifact file type');
  }
  return files.sort();
}

export async function downloadSourceCandidate(work, sourceId, { fetcher = fetch, packages } = {}) {
  const metadata = await readJson(path.join(work, 'source-metadata.json'));
  const plan = await readJson(path.join(work, 'source-plan.json'));
  const expectedPlan = sourceDownloadMatrix(metadata);
  if (encode(plan) !== encode(expectedPlan)) throw Error('Source download plan differs from pinned metadata');
  const batch = plan.include.find(item => item.source_id === sourceId);
  if (!batch) throw Error(`Unknown source batch: ${sourceId}`);
  const source = metadata.sources[batch.source_key];
  const single = { ...metadata, sources: { [batch.source_key]: source } };
  const metadataFile = path.join(work, 'single-source.json');
  await writeJson(metadataFile, single);
  const files = await downloadSources(single, path.join(work, 'download'), fetcher, 1);
  await normalizeIsolated({ input: metadataFile, raw: path.join(work, 'download'), output: path.join(work, 'candidate') });
  const sample = goldenSourceEvidence(packages ?? await loadPackages(), source, await readJson(files[0]));
  const evidencePath = `raw/${source.serviceCode}/${source.region}.json`;
  if (sample) await writeJson(path.join(work, evidencePath), sample);
  const artifactFiles = [];
  for (const folder of ['sources', 'indexes', 'chunks']) artifactFiles.push(...await filesUnder(work, `candidate/${folder}/${source.serviceCode}/${source.region}`));
  if (sample) artifactFiles.push(evidencePath);
  const checksums = Object.fromEntries(await Promise.all(artifactFiles.map(async file => [file, await fileChecksum(path.join(work, file))])));
  await writeJson(path.join(work, 'source-results', `${sourceId}.json`), { sourceId, sourceKey: batch.source_key, metadataSha256: checksum(encode(source)), checksums });
  console.log(`Source ${batch.source_key}: downloaded pinned version ${source.version}, normalized, files=${artifactFiles.length}`);
}

export async function verifySourceCandidates(work, metadata, plan) {
  if (encode(plan) !== encode(sourceDownloadMatrix(metadata))) throw Error('Source plan differs from pinned metadata');
  if (!plan.include.length) return;
  const names = await readdir(path.join(work, 'source-results'));
  if (names.length !== plan.include.length || names.some(name => !plan.include.some(item => name === `${item.source_id}.json`))) throw Error('Incomplete or unexpected source results');
  for (const batch of plan.include) {
    const result = await readJson(path.join(work, 'source-results', `${batch.source_id}.json`));
    const source = metadata.sources[batch.source_key];
    if (result.sourceId !== batch.source_id || result.sourceKey !== batch.source_key || result.metadataSha256 !== checksum(encode(source))) throw Error(`Source identity mismatch: ${batch.source_key}`);
    const expected = [];
    for (const folder of ['sources', 'indexes', 'chunks']) expected.push(...await filesUnder(work, `candidate/${folder}/${source.serviceCode}/${source.region}`));
    const evidencePath = `raw/${source.serviceCode}/${source.region}.json`;
    if (result.checksums?.[evidencePath]) expected.push(evidencePath);
    if (encode(Object.keys(result.checksums ?? {}).sort()) !== encode(expected.sort())) throw Error('Source artifact inventory mismatch');
    for (const file of expected) if (await fileChecksum(path.join(work, file)) !== result.checksums[file]) throw Error(`Source artifact checksum mismatch: ${file}`);
  }
}

export async function assembleSourceCandidates(work, previous) {
  const metadata = await readJson(path.join(work, 'source-metadata.json'));
  const plan = await readJson(path.join(work, 'source-plan.json'));
  await verifySourceCandidates(work, metadata, plan);
  const unchanged = { ...metadata, sources: Object.fromEntries(Object.entries(metadata.sources).filter(([, source]) => !source.changed)) };
  const unchangedFile = path.join(work, 'unchanged-sources.json');
  await writeJson(unchangedFile, unchanged);
  await normalizeIsolated({ input: unchangedFile, output: path.join(work, 'candidate'), previous });
  await writeJson(path.join(work, 'candidate', 'source-metadata.json'), metadata);
  console.log(`Source assembly: ${plan.include.length} verified downloads; ${Object.keys(unchanged.sources).length} reused sources`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [work = '.work/update', sourceId] = process.argv.slice(2);
  await downloadSourceCandidate(work, sourceId);
}
