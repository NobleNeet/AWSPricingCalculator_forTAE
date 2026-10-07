import { access } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './package-loader.js';

export function chunkManifestRelativePath(serviceCode, region) {
  return `chunks/${serviceCode}/${region}/manifest.json`;
}

export function productsRelativePath(serviceCode, region) {
  return `sources/${serviceCode}/${region}/products.json`;
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
