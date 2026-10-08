import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackage } from '../../tools/pricing-cli/package-loader.js';
import { evaluateService } from '../../src/pricing/core.js';
import { fillDefinitionDefaults } from '../../src/app/drawer-state-model.js';

const pkg = await loadPackage('services/ec2');
// Public Price List Tokyo SKU G7K2HMN3E2YE2YE2 / Surcharge, observed 2026-10-08.
const dimension = price => ({ unit: 'Hrs', beginRange: '0', endRange: 'Inf', pricePerUnit: { USD: price } });
const fee = { sku: 'G7K2HMN3E2YE2YE2', productFamily: 'Fee', operation: 'Surcharge', attributes: { group: 'EC2-Dedicated Usage', regionCode: 'ap-northeast-1', usagetype: 'APN1-DedicatedUsage' }, terms: { onDemand: [{ priceDimensions: [dimension('2')] }] } };
const compute = tenancy => ({ sku: `compute-${tenancy}`, productFamily: 'Compute Instance', attributes: { instanceType: 't3.micro', tenancy, operatingSystem: 'Linux', preInstalledSw: 'NA', capacitystatus: 'Used', marketoption: 'OnDemand', licenseModel: 'No License required' }, terms: { onDemand: [{ priceDimensions: [dimension('0.0145')] }] } });
function estimate({ tenancy = 'Dedicated', quantity = '1', computeHours = '730', feeHours = '730', enabled = true } = {}) {
  const instance = { profileId: 'standard', selectors: { tenancy, os: 'Linux', software: 'NA', ebsVolumeType: 'none' }, components: { instance: { inputs: { instanceType: 't3.micro', hours: computeHours, quantity } }, 'dedicated-region-fee': { enabled, inputs: { hours: feeHours } } } };
  return evaluateService(pkg, instance, { region: 'ap-northeast-1', hoursPerMonth: '730' }, [compute(tenancy), fee]);
}
test('Dedicated region surcharge is charged once regardless of instance count', () => {
  for (const quantity of ['1', '2', '10']) {
    const result = estimate({ quantity });
    assert.equal(result.issues.length, 0);
    assert.equal(result.components['dedicated-region-fee'].amountUsd, '1460');
    assert.equal(result.components['dedicated-region-fee'].billingQuantity, '730');
    assert.equal(result.components.instance.billingQuantity, String(730 * Number(quantity)));
  }
});
test('regional active hours are explicit and independent of individual instance hours', () => {
  const result = estimate({ computeHours: '100', feeHours: '200', quantity: '2' });
  assert.equal(result.components.instance.amountUsd, '2.9');
  assert.equal(result.components['dedicated-region-fee'].amountUsd, '400');
  assert.equal(estimate({ feeHours: '0' }).components['dedicated-region-fee'].amountUsd, '0');
});
test('Shared tenancy excludes surcharge and another Dedicated row may omit an already counted regional fee', () => {
  assert.equal(estimate({ tenancy: 'Shared' }).components['dedicated-region-fee'].state, 'disabled');
  assert.equal(estimate({ enabled: false }).components['dedicated-region-fee'].state, 'disabled');
  // Capacity Reservations incur the regional fee even when no instance is running.
  assert.equal(estimate({ quantity: '0' }).components['dedicated-region-fee'].amountUsd, '1460');
});
test('existing saved Dedicated rows gain the regional component without changing compute inputs', () => {
  const instance = { profileId: 'standard', selectors: { tenancy: 'Dedicated' }, components: { instance: { inputs: { hours: '100', quantity: '2' } } } };
  assert.equal(fillDefinitionDefaults(pkg, instance), true);
  assert.deepEqual(instance.components['dedicated-region-fee'], { enabled: true, inputs: { hours: '730' } });
  assert.equal(instance.components.instance.inputs.hours, '100');
});
