import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateService } from '../../src/pricing/core.js';
import { calculate } from '../../src/pricing/calculation.js';
import { validatePriceData } from '../../tools/pricing-cli/semantics.js';

function pricedProduct({ sku, serviceCode, operation = '', attributes = {}, unit = 'Hrs', price = '1' }) {
  return {
    sku,
    productFamily: 'Fixture',
    operation,
    usageType: '',
    attributes,
    terms: {
      onDemand: [{
        offerTermCode: 'JRTCKXETXF',
        effectiveDate: '2026-01-01T00:00:00Z',
        priceDimensions: [{
          rateCode: `${sku}.rate`,
          description: 'fixture',
          unit,
          beginRange: '0',
          endRange: 'Inf',
          pricePerUnit: { USD: price }
        }]
      }]
    },
    serviceCode
  };
}

function overridePackage() {
  return {
    service: {
      id: 'fixture-service',
      defaultProfile: 'standard',
      profiles: ['standard'],
      priceSource: {
        serviceCode: 'BaseService',
        componentOverrides: { insights: 'OverrideService' }
      }
    },
    profiles: {
      standard: {
        id: 'standard',
        selectors: [],
        fixedFilters: [{ field: 'attributes.databaseEngine', op: 'eq', value: 'Aurora PostgreSQL' }],
        components: ['insights']
      }
    },
    components: {
      insights: {
        id: 'insights',
        selectors: [],
        usageInputs: [{ id: 'hours', label: 'Hours', type: 'number', default: '1', minimum: '0' }],
        fixedFilters: [],
        priceQuery: {
          expect: 'singleSku',
          productFilters: [{ field: 'operation', op: 'eq', value: 'Aurora-PostgreSQL:Limitless' }],
          dimensionFilters: [{ field: 'unit', op: 'eq', value: 'Hrs' }]
        },
        calculation: {
          model: 'unit',
          usage: { sources: [{ valueFrom: 'component.hours' }], combine: 'multiply' },
          transforms: [],
          outputUnit: 'Hrs'
        },
        limitations: []
      }
    },
    coverage: { categories: [] }
  };
}

test('component override source is not filtered by base-service profile filters', () => {
  const pkg = overridePackage();
  const base = pricedProduct({
    sku: 'base',
    serviceCode: 'BaseService',
    attributes: { databaseEngine: 'Aurora PostgreSQL' }
  });
  const override = pricedProduct({
    sku: 'override',
    serviceCode: 'OverrideService',
    operation: 'Aurora-PostgreSQL:Limitless'
  });
  const instance = {
    profileId: 'standard',
    selectors: {},
    components: { insights: { enabled: true, inputs: { hours: '1' } } }
  };

  const result = evaluateService(
    pkg,
    instance,
    { region: 'ap-northeast-1', defaultRegion: 'ap-northeast-1', hoursPerMonth: '730' },
    [base],
    [base],
    { BaseService: [base], OverrideService: [override] }
  );
  assert.deepEqual(result.issues, []);
  assert.equal(result.components.insights.resolution.product.sku, 'override');

  const checked = validatePriceData(
    [pkg],
    {
      'BaseService/ap-northeast-1': { serviceCode: 'BaseService', region: 'ap-northeast-1', products: [base] },
      'OverrideService/ap-northeast-1': { serviceCode: 'OverrideService', region: 'ap-northeast-1', products: [override] }
    },
    { rules: [] },
    { BaseService: { rules: [], discriminators: [] }, OverrideService: { rules: [], discriminators: [] } },
    { includeCoverage: false }
  );
  assert.deepEqual(checked.issues, []);
  assert.equal(checked.resolutions.length, 1);
});

test('GB-month and GB-Mo are equivalent billing units', () => {
  const result = calculate(
    {
      model: 'unit',
      usage: { sources: [{ valueFrom: 'component.storageGb' }], combine: 'multiply' },
      transforms: [],
      outputUnit: 'GB-Mo'
    },
    { component: { storageGb: '30' } },
    {
      unit: 'GB-month',
      beginRange: '0',
      endRange: 'Inf',
      pricePerUnit: { USD: '0.1' }
    }
  );
  assert.equal(result.amountUsd, '3');
  assert.equal(result.billingUnit, 'GB-month');
});
