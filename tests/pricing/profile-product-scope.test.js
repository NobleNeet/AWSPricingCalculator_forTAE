import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateService } from '../../src/pricing/core.js';

const dimension = { unit: 'GB-Mo', beginRange: '0', endRange: 'Inf', pricePerUnit: { USD: '0.1' } };
const compute = {
  sku: 'compute-linux',
  productFamily: 'Compute Instance',
  attributes: { operatingSystem: 'Linux' },
  terms: { onDemand: [] }
};
const storage = {
  sku: 'storage-gp3',
  productFamily: 'Storage',
  attributes: { volumeApiName: 'gp3' },
  terms: { onDemand: [{ priceDimensions: [dimension] }] }
};

const pkg = {
  profiles: {
    standard: {
      selectors: [{
        id: 'os',
        label: 'Operating system',
        type: 'select',
        default: 'Linux',
        options: {
          attribute: 'operatingSystem',
          filters: [{ field: 'productFamily', op: 'eq', value: 'Compute Instance' }]
        }
      }],
      fixedFilters: [],
      components: ['ebs']
    }
  },
  components: {
    ebs: {
      selectors: [],
      usageInputs: [{ id: 'storageGb', label: 'Storage', type: 'number', default: '30', minimum: '0' }],
      fixedFilters: [],
      priceQuery: {
        expect: 'singleSku',
        productFilters: [{ field: 'productFamily', op: 'eq', value: 'Storage' }],
        dimensionFilters: [{ field: 'unit', op: 'eq', value: 'GB-Mo' }]
      },
      calculation: {
        model: 'unit',
        usage: { sources: [{ valueFrom: 'component.storageGb' }], combine: 'multiply' },
        transforms: [],
        outputUnit: 'GB-Mo'
      },
      limitations: []
    }
  }
};

const instance = {
  profileId: 'standard',
  selectors: { os: 'Linux' },
  components: { ebs: { inputs: { storageGb: '30' } } }
};

test('profile selectors validate against regional products while component pricing stays scoped', () => {
  const broken = evaluateService(pkg, instance, {}, [storage]);
  assert.equal(broken.issues[0]?.code, 'RESELECT_REQUIRED');

  const result = evaluateService(pkg, instance, {}, [storage], [compute, storage]);
  assert.equal(result.state, 'ready');
  assert.equal(result.amountUsd, '3');
});
