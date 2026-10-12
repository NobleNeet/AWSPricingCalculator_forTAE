import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Independent screenshot-derived contract, intentionally not imported from Service Definitions.
const contract = JSON.parse(readFileSync(new URL('../services/redshift/ui-contract.json', import.meta.url), 'utf8'));
const ids = mode => contract.modes[mode].sections.flatMap(section => section.fields.map(field => field.id));
const sectionIds = mode => contract.modes[mode].sections.map(section => section.id);

test('Redshift screenshot contracts have no duplicated visible fields or sections', () => {
  for (const mode of Object.keys(contract.modes)) {
    const fields = ids(mode);
    const sections = sectionIds(mode);
    assert.equal(new Set(fields).size, fields.length, mode + ' duplicate fields');
    assert.equal(new Set(sections).size, sections.length, mode + ' duplicate sections');
    assert.ok(fields.every(id => typeof id === 'string' && id));
  }
});

test('Provisioned screenshot has five sections and seven logical inputs', () => {
  assert.deepEqual(sectionIds('provisioned'), ['instance','backup','spectrum','managedStorage','dataTransfer']);
  assert.deepEqual(ids('provisioned'), ['nodes','instanceType','utilization','backupGb','spectrumTb','managedGb','transferInGb']);
});

test('Serverless screenshot has four sections and six logical inputs without Spectrum', () => {
  assert.deepEqual(sectionIds('serverless'), ['serverless','backup','managedStorage','dataTransfer']);
  assert.deepEqual(ids('serverless'), ['workloadSize','baseRpu','dailyRuntimeHours','backupGb','managedGb','transferInGb']);
});

test('Pricing-independent screenshot defaults are preserved', () => {
  const fields = mode => Object.fromEntries(contract.modes[mode].sections.flatMap(s => s.fields.map(f => [f.id,f])));
  assert.equal(fields('provisioned').nodes.default, '1');
  assert.equal(fields('provisioned').instanceType.default, 'dc2.8xlarge');
  assert.equal(fields('provisioned').utilization.default, '100');
  assert.equal(fields('serverless').workloadSize.default, 'Medium');
  assert.equal(fields('serverless').baseRpu.default, '128');
  assert.equal(fields('serverless').dailyRuntimeHours.default, '1');
});

// This test only checks integrity of the independent reference contract.
// A subsequent Playwright test MUST compare *rendered and visible* drawer fields
// against it once Redshift is implemented; passing this test is not UI parity.
