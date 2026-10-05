import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePriceData } from '../../tools/pricing-cli/semantics.js';

function product() {
  return {
    sku: 'SKU-MAPPED',
    productFamily: 'Storage',
    operation: '',
    usageType: 'APN1-EBS:VolumeUsage.gp3',
    attributes: { volumeApiName: 'gp3' },
    terms: {
      onDemand: [{
        priceDimensions: [{
          rateCode: 'SKU-MAPPED.rate',
          description: 'storage',
          unit: 'GB-Mo',
          beginRange: '0',
          endRange: 'Inf',
          pricePerUnit: { USD: '0.08' }
        }]
      }]
    }
  };
}

function packageDefinition({ mapped }) {
  return {
    service: {
      id: mapped ? 'mapped-example' : 'legacy-example',
      defaultProfile: 'default',
      profiles: ['default'],
      priceSource: { serviceCode: 'Example' }
    },
    profiles: {
      default: { selectors: [], components: ['storage'], fixedFilters: [] }
    },
    components: {
      storage: {
        defaultEnabled: true,
        optional: false,
        selectors: [],
        usageInputs: [],
        fixedFilters: [],
        priceQuery: {
          productFilters: [{ field: 'productFamily', op: 'eq', value: 'Storage' }],
          dimensionFilters: [{ field: 'unit', op: 'eq', value: 'GB-Mo' }]
        },
        limitations: [],
        calculation: { type: 'intentionally-unsupported' }
      }
    },
    pricingMappings: mapped ? {
      storage: {
        schemaVersion: 1,
        id: 'storage',
        componentId: 'storage',
        priceSource: { serviceCode: 'Example' },
        productMatchers: [{ field: 'productFamily', op: 'eq', value: 'Storage' }],
        dimensionMatchers: [{ field: 'unit', op: 'eq', value: 'GB-Mo' }],
        expect: { products: 1, billableDimensions: 1 }
      }
    } : {},
    coverage: { categories: [] }
  };
}

const data = {
  'Example/ap-northeast-1': {
    schemaVersion: 1,
    serviceCode: 'Example',
    region: 'ap-northeast-1',
    products: [product()]
  }
};

test('mapped price-data validation resolves mapping without legacy calculation evaluation', () => {
  const checked = validatePriceData(
    [packageDefinition({ mapped: true })],
    data,
    {},
    {},
    { includeCoverage: false }
  );

  assert.deepEqual(checked.issues, []);
  assert.equal(checked.resolutions.length, 1);
  assert.equal(checked.resolutions[0].resolutionMode, 'mapping');
  assert.equal(checked.resolutions[0].result.components.storage.resolution.product.sku, 'SKU-MAPPED');
});

test('unmapped price-data validation retains legacy evaluation path', () => {
  const checked = validatePriceData(
    [packageDefinition({ mapped: false })],
    data,
    {},
    {},
    { includeCoverage: false, includeDefaultChecks: false }
  );

  assert.equal(checked.resolutions.length, 1);
  assert.equal(checked.resolutions[0].resolutionMode, 'legacy');
  assert.ok(checked.issues.some(entry => entry.severity === 'error'));
});
