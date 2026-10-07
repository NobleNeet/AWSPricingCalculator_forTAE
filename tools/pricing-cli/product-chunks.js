import { access, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { encode } from './normalize.js';
import { readJson } from './package-loader.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PRODUCT_CHUNK_SIZE = positiveInt(process.env.PRICE_PRODUCT_CHUNK_SIZE, 5000);

export function chunkManifestRelativePath(serviceCode, region) {
  return `chunks/${serviceCode}/${region}/manifest.json`;
}

export function productsRelativePath(serviceCode, region) {
  return `sources/${serviceCode}/${region}/products.json`;
}

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

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function forEachProductChunk(directory, source, visitor) {
  const serviceCode = source.serviceCode;
  const region = source.region;
  const manifestPath = source.chunkManifestPath ?? chunkManifestRelativePath(serviceCode, region);
  const absoluteManifest = path.join(directory, manifestPath);
  if (!(await exists(absoluteManifest))) {
    const fallbackPath = source.productsPath ?? productsRelativePath(serviceCode, region);
    const loaded = await readJson(path.join(directory, fallbackPath));
    await visitor(loaded, { path: fallbackPath, count: loaded.products.length, legacy: true });
    return { chunks: 1, products: loaded.products.length, legacy: true };
  }

  const manifest = await readJson(absoluteManifest);
  let products = 0;
  for (const chunk of manifest.chunks) {
    const loaded = await readJson(path.join(directory, chunk.path));
    products += loaded.products.length;
    await visitor(loaded, chunk);
  }
  return { chunks: manifest.chunks.length, products, legacy: false, manifest };
}

export async function loadProductsMatching(directory, source, predicate = () => true, options = {}) {
  const products = [];
  let buildId = source.buildId ?? 'candidate';
  const stats = await forEachProductChunk(directory, source, async (loaded, chunk) => {
    buildId = loaded.buildId ?? buildId;
    if (options.onChunk) await options.onChunk(loaded, chunk);
    for (const product of loaded.products) if (predicate(product)) products.push(product);
  });
  products.sort((a, b) => a.sku.localeCompare(b.sku));
  return {
    data: {
      schemaVersion: 1,
      buildId,
      serviceCode: source.serviceCode,
      region: source.region,
      products
    },
    stats: { ...stats, selectedProducts: products.length }
  };
}

function chunkContainsRequestedSku(chunk, sortedSkus) {
  if (!sortedSkus.length) return false;
  if (!chunk.firstSku || !chunk.lastSku) return true;
  let low = 0;
  let high = sortedSkus.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedSkus[mid].localeCompare(chunk.firstSku) < 0) low = mid + 1;
    else high = mid;
  }
  return low < sortedSkus.length && sortedSkus[low].localeCompare(chunk.lastSku) <= 0;
}

export async function loadProductsForSkus(directory, source, skus) {
  const wanted = skus instanceof Set ? skus : new Set(skus ?? []);
  const serviceCode = source.serviceCode;
  const region = source.region;
  const fallbackPath = source.productsPath ?? productsRelativePath(serviceCode, region);
  if (!wanted.size) {
    return { schemaVersion: 1, buildId: source.buildId ?? 'candidate', serviceCode, region, products: [] };
  }

  const manifestPath = source.chunkManifestPath ?? chunkManifestRelativePath(serviceCode, region);
  const absoluteManifest = path.join(directory, manifestPath);
  if (!(await exists(absoluteManifest))) {
    const loaded = await readJson(path.join(directory, fallbackPath));
    return { ...loaded, products: loaded.products.filter(product => wanted.has(product.sku)) };
  }

  const manifest = await readJson(absoluteManifest);
  const sortedSkus = [...wanted].sort((a, b) => a.localeCompare(b));
  const products = [];
  const found = new Set();
  for (const chunk of manifest.chunks.filter(item => chunkContainsRequestedSku(item, sortedSkus))) {
    const loaded = await readJson(path.join(directory, chunk.path));
    for (const product of loaded.products) {
      if (!wanted.has(product.sku)) continue;
      products.push(product);
      found.add(product.sku);
    }
    if (found.size === wanted.size) break;
  }
  products.sort((a, b) => a.sku.localeCompare(b.sku));
  return {
    schemaVersion: 1,
    buildId: manifest.buildId,
    serviceCode,
    region,
    products
  };
}

export async function loadCandidateForPublish(directory, metadata, publishSkus = {}) {
  const data = {};
  for (const [key, source] of Object.entries(metadata.sources ?? {})) {
    if (Object.hasOwn(publishSkus, key)) {
      data[key] = await loadProductsForSkus(directory, source, publishSkus[key]);
      continue;
    }
    // A scoped onboarding run validates only the requested/changed price sources.
    // Sources outside that scope were copied into the candidate from the active
    // build and must be preserved verbatim rather than interpreted as an empty
    // validated SKU set.
    data[key] = (await loadProductsMatching(directory, source)).data;
  }
  return { metadata, data };
}
