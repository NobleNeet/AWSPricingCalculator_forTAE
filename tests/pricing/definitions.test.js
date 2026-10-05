import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateDefinitions } from '../../tools/pricing-cli/validate-definitions.js';
import { loadPackage } from '../../tools/pricing-cli/package-loader.js';
import { run } from '../../tools/pricing-cli/cli.js';

import { fixturePackage } from '../fixtures/definitions.js';
test('valid package and CLI report', async () => {
  const pkg = fixturePackage();
  assert.deepEqual(await validateDefinitions([pkg]), []);
  const root = await mkdtemp(path.join(tmpdir(), 'tae-definitions-'));
  const directory = path.join(root, 'example');
  for (const kind of ['profiles', 'components', 'golden']) await mkdir(path.join(directory, kind), { recursive: true });
  for (const [file, object] of [['service.json', pkg.service], ['coverage.json', pkg.coverage], ['profiles/standard.json', pkg.profiles.standard], ['components/meter.json', pkg.components.meter]]) await writeFile(path.join(directory, file), JSON.stringify(object));
  assert.equal((await loadPackage(directory)).service.id, 'example');
  assert.equal((await run('validate-definitions', { services: root })).status, 'passed');
  await assert.rejects(() => run('publish'), /Unknown command/);
});
test('schema/reference/duplicate/default/orphan/cycle failures have stable codes', async () => {
  const cases = [
    ['SCHEMA_ERROR', p => p.components.meter.priceQuery.expect = 'cheapest'],
    ['MISSING_PROFILE', p => p.service.profiles.push('missing')],
    ['MISSING_COMPONENT', p => p.profiles.standard.components.push('missing')],
    ['SCHEMA_ERROR', p => p.profiles.standard.components.push('outside/foreign')],
    ['SCHEMA_ERROR', p => p.profiles.standard.selectors = null],
    ['FILE_ID_MISMATCH', p => p.components.meter.id = 'other'],
    ['DUPLICATE_INPUT_ID', p => p.components.meter.usageInputs.push(p.components.meter.usageInputs[0])],
    ['INVALID_REFERENCE', p => p.components.meter.calculation.usage.sources[0].valueFrom = 'component.unknown'],
    ['INVALID_DEFAULT', p => p.components.meter.usageInputs[0].default = '-1'],
    ['ORPHAN_DEFINITION', p => p.components.orphan = { ...p.components.meter, id: 'orphan' }],
    ['DEPENDENCY_CYCLE', p => p.components.meter.usageInputs[0].enabledWhen = { field: 'component.hours', op: 'exists' }]
  ];
  for (const [code, mutate] of cases) {
    const pkg = fixturePackage(); mutate(pkg);
    assert.ok((await validateDefinitions([pkg])).some(i => i.code === code), code);
  }
});

test('pricing mapping valueFrom references must exist in every profile using the component', async () => {
  const pkg = fixturePackage();
  pkg.service.pricingMappings = ['meter'];
  pkg.pricingMappings = {
    meter: {
      schemaVersion: 1,
      id: 'meter',
      componentId: 'meter',
      priceSource: { serviceCode: 'Example' },
      productMatchers: [{ field: 'attributes.mode', op: 'eq', valueFrom: 'component.missing' }],
      dimensionMatchers: [{ field: 'unit', op: 'eq', value: 'Hrs' }],
      expect: { products: 1, billableDimensions: 1 }
    }
  };
  const issues = await validateDefinitions([pkg]);
  assert.ok(issues.some(entry => entry.code === 'INVALID_REFERENCE' && entry.path === 'pricing-mappings/meter'));
});
