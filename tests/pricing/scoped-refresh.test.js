import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { definitionRefreshServiceCodes } from '../../tools/price-update.js';
import {
  changedPriceSourceCodes,
  PRICING_CONTRACT_FILES,
  PUBLICATION_CONTRACT_FILES,
  semanticGlobalChanged,
  SEMANTIC_CONTRACT_VERSION
} from '../../tools/pricing-cli/fingerprint.js';
import { readGoldenRawSource } from '../../tools/golden-evidence.js';

const packages = [
  { directory: 'services/lambda', service: { priceSource: { serviceCode: 'AWSLambda' } } },
  { directory: 'services/ec2', service: { priceSource: { serviceCode: 'AmazonEC2' } } },
  { directory: 'services/rds', service: { priceSource: { serviceCode: 'AmazonRDS' } } }
];

test('service Definition changes refresh only the affected AWS service', () => {
  const codes = definitionRefreshServiceCodes(packages, [
    'services/lambda/coverage.json',
    'tools/pricing-cli/normalize-isolated.js'
  ]);
  assert.deepEqual([...codes], ['AWSLambda']);
});

test('multiple service Definition changes refresh only those services', () => {
  const codes = definitionRefreshServiceCodes(packages, [
    'services/lambda/components/duration.json',
    'services/ec2/profiles/standard.json'
  ]);
  assert.deepEqual([...codes].sort(), ['AWSLambda', 'AmazonEC2'].sort());
});

test('service-specific normalizer refreshes only its service', () => {
  const codes = definitionRefreshServiceCodes(packages, ['pricing/normalization/services/AWSLambda.json']);
  assert.deepEqual([...codes], ['AWSLambda']);
});

test('shared fingerprint inputs and pricing contract changes safely fall back to full refresh', () => {
  assert.equal(definitionRefreshServiceCodes(packages, ['pricing/normalization/common.json']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['pricing/limitations.json']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['tools/pricing-cli/semantics.js']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['src/pricing/core.js']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['services/lambda/coverage.json', 'tools/pricing-cli/semantics.js']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['tools/price-update.js']), null);
  assert.equal(definitionRefreshServiceCodes(packages, undefined), null);
});

test('publication and orchestration files do not invalidate semantic validation globally', () => {
  for (const file of [
    'tools/pricing-cli/build.js',
    'tools/pricing-cli/cli.js',
    'tools/pricing-cli/encoding.js',
    'tools/pricing-cli/price-index.js',
    'tools/pricing-cli/product-chunk-writer.js',
    'tools/pricing-cli/publication-candidate.js',
    'tools/publish-price-build.js'
  ]) assert.equal(PRICING_CONTRACT_FILES.includes(file), false, file);

  for (const file of [
    'tools/pricing-cli/build.js',
    'tools/pricing-cli/encoding.js',
    'tools/pricing-cli/price-index.js',
    'tools/pricing-cli/product-chunk-writer.js',
    'tools/pricing-cli/publication-candidate.js',
    'tools/publish-price-build.js'
  ]) assert.ok(PUBLICATION_CONTRACT_FILES.includes(file), file);

  for (const file of [
    'src/pricing/mapping.js',
    'src/pricing/decimal.js',
    'src/pricing/issues.js',
    'tools/pricing-cli/inventory.js',
    'tools/pricing-cli/normalize.js',
    'tools/pricing-cli/product-chunks.js',
    'tools/pricing-cli/semantic-validation-worker.js',
    'tools/pricing-cli/semantics.js'
  ]) assert.ok(PRICING_CONTRACT_FILES.includes(file), file);
});

test('known v1 baseline migrates to the verified semantic contract v2 without a global revalidation', () => {
  const previous = {
    schemaVersion: 1,
    global: 'b253ce3d9e872d068ac10c7aa44a45d34ebe5dfed4ffef42cba100fc42ba3385',
    services: {}
  };
  const current = {
    schemaVersion: SEMANTIC_CONTRACT_VERSION,
    global: '40ca156ff3ad83a80ee75bb29eaa26d5ccc96d361b1252921a607344930b925e',
    services: {}
  };
  assert.equal(semanticGlobalChanged(previous, current), false);
  assert.equal(
    semanticGlobalChanged(previous, { ...current, global: 'different-v2-contract' }),
    true
  );
});

test('persisted per-service fingerprints refresh only changed price sources', () => {
  const fingerprintPackages = [
    {
      service: { id: 'lambda', priceSource: { serviceCode: 'AWSLambda', componentOverrides: {} } },
      pricingMappings: {}
    },
    {
      service: { id: 'rds', priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
      pricingMappings: {
        insights: { priceSource: { serviceCode: 'AmazonCloudWatch' } }
      }
    }
  ];
  const previous = {
    schemaVersion: 1,
    global: 'g1',
    services: { lambda: 'l1', rds: 'r1' }
  };
  const current = {
    schemaVersion: 1,
    global: 'g1',
    services: { lambda: 'l2', rds: 'r1' }
  };
  assert.deepEqual([...changedPriceSourceCodes(fingerprintPackages, previous, current)], ['AWSLambda']);
});

test('changed service fingerprint includes mapping override price sources', () => {
  const fingerprintPackages = [{
    service: { id: 'rds', priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
    pricingMappings: {
      insights: { priceSource: { serviceCode: 'AmazonCloudWatch' } }
    }
  }];
  const previous = { schemaVersion: 1, global: 'g1', services: { rds: 'old' } };
  const current = { schemaVersion: 1, global: 'g1', services: { rds: 'new' } };
  assert.deepEqual(
    [...changedPriceSourceCodes(fingerprintPackages, previous, current)].sort(),
    ['AmazonCloudWatch', 'AmazonRDS'].sort()
  );
});

test('missing or changed global fingerprint safely refreshes every price source', () => {
  const fingerprintPackages = [{
    service: { id: 'rds', priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
    pricingMappings: {
      insights: { priceSource: { serviceCode: 'AmazonCloudWatch' } }
    }
  }];
  const current = { schemaVersion: 1, global: 'g2', services: { rds: 'same' } };
  assert.deepEqual(
    [...changedPriceSourceCodes(fingerprintPackages, null, current)].sort(),
    ['AmazonCloudWatch', 'AmazonRDS'].sort()
  );
  assert.deepEqual(
    [...changedPriceSourceCodes(
      fingerprintPackages,
      { schemaVersion: 1, global: 'g1', services: { rds: 'same' } },
      current
    )].sort(),
    ['AmazonCloudWatch', 'AmazonRDS'].sort()
  );
});

test('Golden evidence fallback prefers the published region fixture over the legacy service fixture', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tae-golden-fallback-'));
  const rawDirectory = path.join(root, 'raw');
  const fixtureDirectory = path.join(root, 'fixtures');
  await mkdir(rawDirectory, { recursive: true });
  await mkdir(path.join(fixtureDirectory, 'Example'), { recursive: true });
  await writeFile(path.join(fixtureDirectory, 'Example.json'), JSON.stringify({ marker: 'legacy' }));
  await writeFile(path.join(fixtureDirectory, 'Example', 'ap-northeast-1.json'), JSON.stringify({ marker: 'regional' }));

  const source = await readGoldenRawSource(rawDirectory, 'Example', 'ap-northeast-1', fixtureDirectory);
  assert.equal(source.marker, 'regional');
});
