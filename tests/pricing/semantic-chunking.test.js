import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadProductsMatching } from '../../tools/pricing-cli/product-chunks.js';
import { writeProductChunks } from '../../tools/pricing-cli/product-chunk-writer.js';
import { sourceTasks } from '../../tools/pricing-cli/semantic-parallel.js';
import { buildSemanticBatches } from '../../tools/pricing-cli/semantic-plan.js';

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

test('semantic workflow batches split case counts into bounded queued jobs', () => {
  const planned = buildSemanticBatches([
    { globalTaskId: 0, serviceCode: 'AmazonEC2', region: 'us-east-1', caseCount: 61000, includeCoverage: false },
    { globalTaskId: 1, serviceCode: 'AmazonRDS', region: 'ap-northeast-1', caseCount: 600, includeCoverage: true },
    { globalTaskId: 2, serviceCode: 'AWSLambda', region: 'ap-northeast-1', caseCount: 0, includeCoverage: true }
  ], 25000, 240);

  assert.equal(planned.batchCases, 25000);
  assert.equal(planned.batches.length, 5);
  assert.deepEqual(planned.batches.filter(batch => batch.service_code === 'AmazonEC2').map(batch => [batch.case_offset, batch.planned_cases]), [
    [0, 25000],
    [25000, 25000],
    [50000, 11000]
  ]);
  assert.equal(planned.batches.find(batch => batch.service_code === 'AmazonRDS').include_coverage, true);
  assert.equal(planned.batches.find(batch => batch.service_code === 'AWSLambda').planned_cases, 0);
});

test('semantic workflow planner expands batch size before exceeding matrix limit', () => {
  const planned = buildSemanticBatches([
    { globalTaskId: 0, serviceCode: 'AmazonEC2', region: 'us-east-1', caseCount: 1000000, includeCoverage: false }
  ], 1000, 10);
  assert.equal(planned.batchCases, 100000);
  assert.equal(planned.batches.length, 10);
});
