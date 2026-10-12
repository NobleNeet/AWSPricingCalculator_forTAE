import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = JSON.parse(readFileSync(new URL('../services/redshift/components/spectrum.json', import.meta.url), 'utf8'));
const mode = component.enabledWhen;
const enabledFor = instanceType => mode.op === 'in' && mode.field === 'profile.instanceType' && mode.value.includes(instanceType);

test('Spectrum additional meter is enabled for provisioned DC2 and RA3 only', () => {
  for (const instanceType of ['dc2.large','dc2.8xlarge','ra3.large','ra3.xlplus','ra3.4xlarge','ra3.16xlarge']) {
    assert.equal(enabledFor(instanceType), true, instanceType);
  }
});

test('RG node types must not incur separately priced Spectrum usage', () => {
  for (const instanceType of ['rg.large','rg.xlarge','rg.4xlarge','rg.12xlarge']) {
    assert.equal(enabledFor(instanceType), false, instanceType);
  }
  assert.equal(component.ui.hideWhenDisabled, true);
});
