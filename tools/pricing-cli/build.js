import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { encode, buildIndex } from './normalize.js';

export const checksum = text => createHash('sha256').update(text).digest('hex');
export async function buildPriceDb(candidate, directory, buildId, validation) {
  if (!/^[a-zA-Z0-9-]+$/.test(buildId)) throw Error('Invalid build ID');
  if (!validation || validation.issues.some(issue => issue.severity === 'error')) throw Error('Validated candidate required');
  const root = path.join(directory, 'builds', buildId);
  try { await access(root); throw Error('Immutable build already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const generatedAt = new Date().toISOString();
  const publicationDate = Object.values(candidate.metadata.sources).map(s => s.publicationDate).sort().at(-1);
  const manifest = { schemaVersion: 1, buildId, generatedAt, publicationDate, currency: 'USD', sources: {} };
  // Precompute every resource before placing the immutable build.
  const resources = [];
  for (const [code, original] of Object.entries(candidate.data).sort()) {
    const data = { ...original, buildId, products: validation.publishSkus?.[code] ? original.products.filter(p => validation.publishSkus[code].has(p.sku)) : original.products };
    const index = buildIndex(data.products, buildId, code, data.region);
    const productsPath = `sources/${code}/${data.region}/products.json`, indexPath = `indexes/${code}/${data.region}/index.json`;
    const productsText = encode(data), indexText = encode(index);
    manifest.sources[code] = { [data.region]: { ...candidate.metadata.sources[code], changed: undefined, productsPath, indexPath, productsSha256: checksum(productsText), indexSha256: checksum(indexText), productsBytes: Buffer.byteLength(productsText), indexBytes: Buffer.byteLength(indexText) } };
    resources.push([productsPath, productsText], [indexPath, indexText]);
  }
  for (const [relative, text] of resources) { const file = path.join(root, relative); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, text, { flag: 'wx' }); }
  await writeFile(path.join(root, 'build-manifest.json'), encode(manifest), { flag: 'wx' });
  return manifest;
}
