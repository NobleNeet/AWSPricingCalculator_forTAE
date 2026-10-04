import test from 'node:test';
import assert from 'node:assert/strict';
import { definitionRefreshServiceCodes } from '../../tools/price-update.js';

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

test('shared fingerprint inputs and unknown scope safely fall back to full refresh', () => {
  assert.equal(definitionRefreshServiceCodes(packages, ['pricing/normalization/common.json']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['pricing/limitations.json']), null);
  assert.equal(definitionRefreshServiceCodes(packages, ['tools/price-update.js']), null);
  assert.equal(definitionRefreshServiceCodes(packages, undefined), null);
});
