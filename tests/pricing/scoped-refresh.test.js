import test from 'node:test';
import assert from 'node:assert/strict';
import { definitionRefreshServiceCodes } from '../../tools/price-update.js';
import { changedPriceSourceCodes } from '../../tools/pricing-cli/fingerprint.js';

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
