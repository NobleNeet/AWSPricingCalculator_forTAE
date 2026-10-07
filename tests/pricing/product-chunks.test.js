import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { encode } from '../../tools/pricing-cli/normalize.js';
import {
  chunkManifestRelativePath,
  loadProductsForSkus,
  writeProductChunks
} from '../../tools/pricing-cli/product-chunks.js';
import { loadCandidateForPublish } from '../../tools/pricing-cli/publication-candidate.js';

function source(productCount = 12, serviceCode = 'Example', region = 'ap-northeast-1') {
  return {
    schemaVersion: 1,
    buildId: 'candidate',
    serviceCode,
    region,
    products: Array.from({ length: productCount }, (_, index) => ({
      sku: `${serviceCode}-sku-${String(index).padStart(4, '0')}`,
      productFamily: 'Compute',
      operation: '',
      usageType: '',
      attributes: {},
      terms: { onDemand: [] }
    }))
  };
}

test('product chunks bound each file and load only requested SKUs', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tae-chunks-'));
  const data = source();
  const written = await writeProductChunks(root, data, { chunkSize: 5 });
  assert.equal(written.manifestPath, chunkManifestRelativePath('Example', 'ap-northeast-1'));
  assert.equal(written.manifest.productCount, 12);
  assert.deepEqual(written.manifest.chunks.map(chunk => chunk.count), [5, 5, 2]);
  assert.ok(written.manifest.chunks.every(chunk => /^[a-f0-9]{64}$/.test(chunk.sha256)));

  const loaded = await loadProductsForSkus(
    root,
    { serviceCode: 'Example', region: 'ap-northeast-1' },
    new Set(['Example-sku-0001', 'Example-sku-0010'])
  );
  assert.deepEqual(loaded.products.map(product => product.sku), ['Example-sku-0001', 'Example-sku-0010']);
});

test('chunk loader falls back to legacy products.json builds', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tae-legacy-'));
  const data = source(4);
  const file = path.join(root, 'sources', 'Example', 'ap-northeast-1', 'products.json');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, encode(data));
  const loaded = await loadProductsForSkus(
    root,
    { serviceCode: 'Example', region: 'ap-northeast-1', productsPath: 'sources/Example/ap-northeast-1/products.json' },
    new Set(['Example-sku-0003'])
  );
  assert.deepEqual(loaded.products.map(product => product.sku), ['Example-sku-0003']);
});

test('published candidate is assembled from selected chunk products', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tae-publish-chunks-'));
  const data = source(9);
  await writeProductChunks(root, data, { chunkSize: 3 });
  const metadata = {
    schemaVersion: 1,
    sources: {
      'Example/ap-northeast-1': {
        serviceCode: 'Example',
        region: 'ap-northeast-1',
        publicationDate: '2026-01-01T00:00:00Z'
      }
    }
  };
  const candidate = await loadCandidateForPublish(root, metadata, {
    'Example/ap-northeast-1': new Set(['Example-sku-0002', 'Example-sku-0007'])
  });
  assert.deepEqual(candidate.data['Example/ap-northeast-1'].products.map(product => product.sku), ['Example-sku-0002', 'Example-sku-0007']);
});

test('scoped publication preserves unvalidated sources instead of publishing them empty', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tae-scoped-publish-'));
  const scoped = source(5, 'Scoped');
  const untouched = source(4, 'Untouched');
  await writeProductChunks(root, scoped, { chunkSize: 2 });
  await writeProductChunks(root, untouched, { chunkSize: 2 });

  const metadata = {
    schemaVersion: 1,
    sources: {
      'Scoped/ap-northeast-1': {
        serviceCode: 'Scoped',
        region: 'ap-northeast-1',
        publicationDate: '2026-01-01T00:00:00Z'
      },
      'Untouched/ap-northeast-1': {
        serviceCode: 'Untouched',
        region: 'ap-northeast-1',
        publicationDate: '2026-01-01T00:00:00Z'
      }
    }
  };

  const candidate = await loadCandidateForPublish(root, metadata, {
    'Scoped/ap-northeast-1': new Set(['Scoped-sku-0003'])
  });

  assert.deepEqual(
    candidate.data['Scoped/ap-northeast-1'].products.map(product => product.sku),
    ['Scoped-sku-0003']
  );
  assert.deepEqual(
    candidate.data['Untouched/ap-northeast-1'].products.map(product => product.sku),
    untouched.products.map(product => product.sku)
  );
});
