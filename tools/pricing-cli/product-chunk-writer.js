import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { encode } from './encoding.js';
import { chunkManifestRelativePath } from './product-chunks.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PRODUCT_CHUNK_SIZE = positiveInt(process.env.PRICE_PRODUCT_CHUNK_SIZE, 5000);

export async function writeProductChunks(directory, data, options = {}) {
  const chunkSize = positiveInt(options.chunkSize, PRODUCT_CHUNK_SIZE);
  const base = path.join(directory, 'chunks', data.serviceCode, data.region);
  await mkdir(base, { recursive: true });
  const chunks = [];
  for (let offset = 0, index = 0; offset < data.products.length; offset += chunkSize, index += 1) {
    const products = data.products.slice(offset, offset + chunkSize);
    const fileName = `${String(index).padStart(5, '0')}.json`;
    const relativePath = `chunks/${data.serviceCode}/${data.region}/${fileName}`;
    const payload = {
      schemaVersion: data.schemaVersion ?? 1,
      buildId: data.buildId,
      serviceCode: data.serviceCode,
      region: data.region,
      products
    };
    const text = encode(payload);
    await writeFile(path.join(directory, relativePath), text);
    chunks.push({
      path: relativePath,
      sha256: createHash('sha256').update(text).digest('hex'),
      count: products.length,
      firstSku: products[0]?.sku ?? null,
      lastSku: products.at(-1)?.sku ?? null
    });
  }
  const manifest = {
    schemaVersion: 1,
    buildId: data.buildId,
    serviceCode: data.serviceCode,
    region: data.region,
    productCount: data.products.length,
    chunkSize,
    chunks
  };
  const manifestPath = chunkManifestRelativePath(data.serviceCode, data.region);
  await writeFile(path.join(directory, manifestPath), encode(manifest));
  return { manifestPath, manifest };
}
