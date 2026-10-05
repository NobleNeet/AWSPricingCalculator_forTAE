import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePricingMapping } from '../../src/pricing/mapping.js';

const mapping = JSON.parse(await readFile(
  new URL('../../services/aurora-postgresql/pricing-mappings/database-insights-limitless.json', import.meta.url),
  'utf8'
));

function product({
  sku,
  usageType,
  retention,
  group,
  price = '0.0031250000'
}) {
  const attributes = {
    databaseEngineType: 'Aurora-PostgreSQL',
    instanceConfigurationType: 'Limitless',
    operation: 'Aurora-PostgreSQL:Limitless',
    servicecode: 'AmazonCloudWatch',
    usagetype: usageType
  };
  if (retention !== undefined) attributes.retention = retention;
  if (group !== undefined) attributes.group = group;

  return {
    sku,
    productFamily: 'CloudWatch Database Insights',
    operation: 'Aurora-PostgreSQL:Limitless',
    usageType,
    attributes,
    terms: {
      onDemand: [{
        priceDimensions: [{
          rateCode: `${sku}.rate`,
          description: 'Database Insights ACU usage',
          unit: 'ACU-Hours',
          beginRange: '0',
          endRange: 'Inf',
          pricePerUnit: { USD: price }
        }]
      }]
    }
  };
}

test('Aurora Limitless mapping selects Advanced Database Insights and excludes Standard retention products', () => {
  const products = [
    product({
      sku: 'ADVANCED',
      usageType: 'APN1-CW:DatabaseInsights-ACU-Hours',
      group: 'CW-DatabaseInsights'
    }),
    product({
      sku: 'STANDARD-AMR',
      usageType: 'APN1-CW:DatabaseInsights-Standard-AMR-ACU-Hours',
      retention: 'AMR',
      price: '0.0000250000'
    }),
    product({
      sku: 'STANDARD-FMR',
      usageType: 'APN1-CW:DatabaseInsights-Standard-FMR-ACU-Hours',
      retention: 'FMR',
      price: '0.0006010000'
    })
  ];

  const result = resolvePricingMapping(products, mapping, {
    project: {},
    profile: {},
    component: {}
  });

  assert.equal(result.product.sku, 'ADVANCED');
  assert.equal(result.dimension.unit, 'ACU-Hours');
});

test('Aurora Limitless mapping fails closed if the Advanced semantic marker disappears', () => {
  const products = [
    product({
      sku: 'ADVANCED-WITHOUT-GROUP',
      usageType: 'APN1-CW:DatabaseInsights-ACU-Hours'
    })
  ];

  assert.throws(
    () => resolvePricingMapping(products, mapping, { project: {}, profile: {}, component: {} }),
    error => error.issue?.code === 'MAPPING_PRODUCT_CARDINALITY'
  );
});
