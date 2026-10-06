import test from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveValidationSourceCodes,
  filterPackagesBySourceCodes,
  parseRequestedServiceIds,
  resolveRequestedValidationScope
} from '../../tools/pricing-cli/update-scope.js';

const packages = [
  {
    directory: 'services/kms',
    service: { id: 'kms', priceSource: { serviceCode: 'awskms', componentOverrides: {} } },
    pricingMappings: {}
  },
  {
    directory: 'services/rds',
    service: { id: 'rds', priceSource: { serviceCode: 'AmazonRDS', componentOverrides: {} } },
    pricingMappings: {
      insights: { priceSource: { serviceCode: 'AmazonCloudWatch' } }
    }
  },
  {
    directory: 'services/lambda',
    service: { id: 'lambda', priceSource: { serviceCode: 'AWSLambda', componentOverrides: {} } },
    pricingMappings: {}
  }
];

test('requested service ids are normalized and deduplicated', () => {
  assert.deepEqual(parseRequestedServiceIds('rds, kms,rds'), ['kms', 'rds']);
});

test('requested service ids resolve all AWS price source codes used by the package', () => {
  const scope = resolveRequestedValidationScope(packages, 'rds');
  assert.deepEqual(scope.serviceIds, ['rds']);
  assert.deepEqual(scope.serviceCodes, ['AmazonCloudWatch', 'AmazonRDS']);
});

test('unknown requested service ids fail closed', () => {
  assert.throws(
    () => resolveRequestedValidationScope(packages, 'does-not-exist'),
    /Unknown validation scope service id/
  );
});

test('unscoped runs keep full validation behavior', () => {
  assert.equal(
    effectiveValidationSourceCodes(
      { requestedScopeServiceIds: [] },
      { sources: { 'AWSLambda/ap-northeast-1': { serviceCode: 'AWSLambda', awsChanged: false } } }
    ),
    null
  );
  assert.equal(filterPackagesBySourceCodes(packages, null), packages);
});

test('scoped runs include requested, definition-refreshed, and concurrently AWS-changed sources', () => {
  const codes = effectiveValidationSourceCodes(
    {
      requestedScopeServiceIds: ['kms'],
      requestedScopeServiceCodes: ['awskms'],
      definitionRefreshServiceCodes: ['awskms']
    },
    {
      sources: {
        'awskms/ap-northeast-1': { serviceCode: 'awskms', awsChanged: false },
        'AWSLambda/ap-northeast-1': { serviceCode: 'AWSLambda', awsChanged: true },
        'AmazonRDS/ap-northeast-1': { serviceCode: 'AmazonRDS', awsChanged: false }
      }
    }
  );
  assert.deepEqual([...codes].sort(), ['AWSLambda', 'awskms'].sort());
  assert.deepEqual(
    filterPackagesBySourceCodes(packages, codes).map(pkg => pkg.service.id).sort(),
    ['kms', 'lambda']
  );
});
