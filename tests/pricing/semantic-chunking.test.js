import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writeProductChunks, loadProductsMatching } from '../../tools/pricing-cli/product-chunks.js';
import { sourceTasks } from '../../tools/pricing-cli/semantic-parallel.js';

function product(sku, family = 'Compute Instance') {
  return {
    sku,
    productFamily: family,
    attributes: { instanceType: sku },
    operation: '',
    usageType: sku,
    terms: { onDemand: [{ priceDimensions: [{ unit: 'Hrs', beginRange: '0', endRange: 'Inf', pricePerUnitUsd: '1' }] }] }
  };
}

test('loadProductsMatching scans chunk files while retaining only matching products', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'semantic-chunks-'));
  try {
    const data = {
      schemaVersion: 1,
      buildId: 'candidate',
      serviceCode: 'Example',
      region: 'ap-northeast-1',
      products: [product('a'), product('b', 'Storage'), product('c'), product('d', 'Storage'), product('e')]
    };
    const { manifestPath } = await writeProductChunks(directory, data, { chunkSize: 2 });
    const seen = [];
    const loaded = await loadProductsMatching(
      directory,
      { serviceCode: 'Example', region: 'ap-northeast-1', chunkManifestPath: manifestPath },
      item => item.productFamily === 'Storage',
      { onChunk: async (_chunk, descriptor) => seen.push(descriptor.path) }
    );
    assert.deepEqual(loaded.data.products.map(item => item.sku), ['b', 'd']);
    assert.equal(loaded.stats.products, 5);
    assert.equal(loaded.stats.selectedProducts, 2);
    assert.equal(loaded.stats.chunks, 3);
    assert.equal(seen.length, 3);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('semantic source tasks attach component override sources for the same region', () => {
  const packages = [{
    service: {
      id: 'example',
      priceSource: {
        serviceCode: 'Primary',
        componentOverrides: { metrics: 'Auxiliary' }
      }
    }
  }];
  const manifest = {
    sources: {
      Primary: {
        'ap-northeast-1': { serviceCode: 'Primary', region: 'ap-northeast-1', productsPath: 'primary.json' }
      },
      Auxiliary: {
        'ap-northeast-1': { serviceCode: 'Auxiliary', region: 'ap-northeast-1', productsPath: 'aux.json' }
      }
    }
  };
  const tasks = sourceTasks(packages, manifest);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].serviceCode, 'Primary');
  assert.deepEqual(Object.keys(tasks[0].sourceDescriptors).sort(), ['Auxiliary', 'Primary']);
});
