import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { encode, buildIndex } from './normalize.js';
import { writeProductChunks } from './product-chunks.js';

export const checksum = text => createHash('sha256').update(text).digest('hex');
export async function buildPriceDb(candidate, directory, buildId, validation) {
  if (!/^[a-zA-Z0-9-]+$/.test(buildId)) throw Error('Invalid build ID');
  if (!validation || validation.issues.some(issue => issue.severity === 'error')) throw Error('Validated candidate required');
  const root = path.join(directory, 'builds', buildId);
  try { await access(root); throw Error('Immutable build already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const generatedAt = new Date().toISOString();
  const publicationDate = Object.values(candidate.metadata.sources).map(s => s.publicationDate).sort().at(-1);
  const manifest = { schemaVersion: 1, buildId, generatedAt, publicationDate, currency: 'USD', sources: {} };
  if (validation.definitionSha256) manifest.definitionSha256 = validation.definitionSha256;
  if (validation.contractFingerprints) manifest.contractFingerprints = validation.contractFingerprints;
  const resources = [];
  const chunkData = [];
  for (const [key, original] of Object.entries(candidate.data).sort(([a], [b]) => a.localeCompare(b))) {
    const code = original.serviceCode, region = original.region;
    const published = validation.publishSkus?.[key];
    const data = { ...original, buildId, products: published ? original.products.filter(p => published.has(p.sku)) : original.products };
    const index = buildIndex(data.products, buildId, code, region);
    const productsPath = `sources/${code}/${region}/products.json`, indexPath = `indexes/${code}/${region}/index.json`;
    const productsText = encode(data), indexText = encode(index);
    const metadata = candidate.metadata.sources[key];
    if (!metadata) throw Error(`Source metadata missing for ${key}`);
    (manifest.sources[code] ??= {})[region] = { ...metadata, changed: undefined, productsPath, indexPath, productsSha256: checksum(productsText), indexSha256: checksum(indexText), productsBytes: Buffer.byteLength(productsText), indexBytes: Buffer.byteLength(indexText) };
    resources.push([productsPath, productsText], [indexPath, indexText]);
    chunkData.push([code, region, data]);
  }
  for (const [relative, text] of resources) { const file = path.join(root, relative); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, text, { flag: 'wx' }); }
  for (const [code, region, data] of chunkData) {
    const chunked = await writeProductChunks(root, data);
    manifest.sources[code][region].chunkManifestPath = chunked.manifestPath;
    manifest.sources[code][region].chunkCount = chunked.manifest.chunks.length;
  }
  await writeFile(path.join(root, 'build-manifest.json'), encode(manifest), { flag: 'wx' });
  return manifest;
}
