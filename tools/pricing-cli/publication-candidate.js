import { access } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './package-loader.js';
import {
  chunkManifestRelativePath,
  loadProductsMatching,
  productsRelativePath
} from './product-chunks.js';

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
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
    return {
      schemaVersion: 1,
      buildId: source.buildId ?? 'candidate',
      serviceCode,
      region,
      products: []
    };
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
    // A scoped validation run produces SKU selections only for sources it actually
    // revalidated. Sources outside that scope are already validated in the active
    // build and must be carried forward, not interpreted as an empty SKU set.
    data[key] = (await loadProductsMatching(directory, source)).data;
  }
  return { metadata, data };
}
