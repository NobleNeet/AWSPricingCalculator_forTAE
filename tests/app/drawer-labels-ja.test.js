import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';
import { DRAWER_LABELS_JA, japaneseDrawerPackage } from '../../src/app/drawer-labels-ja.js';

const stripLabels = value => {
  if (Array.isArray(value)) return value.map(stripLabels);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'label').map(([key, item]) => [key, stripLabels(item)]));
  return value;
};

test('all current drawers have Japanese labels and retain the entire pricing and validation contract', async () => {
  for (const pkg of await loadPackages()) {
    const original = structuredClone(pkg);
    const labels = DRAWER_LABELS_JA[pkg.service.id];
    assert.ok(labels, pkg.service.id);
    const view = japaneseDrawerPackage(pkg);
    assert.deepEqual(stripLabels(view), stripLabels(original), pkg.service.id);
    assert.deepEqual(pkg, original, 'cached Definition must not be mutated');
    for (const [id, profile] of Object.entries(pkg.profiles)) {
      assert.ok(labels.profiles[id], `${pkg.service.id}/${id}`);
      for (const input of profile.selectors) {
        assert.ok(labels.fields[input.id] || /[ぁ-んァ-ヶ一-龠]/u.test(input.label), `${pkg.service.id}/${input.id}`);
      }
    }
    for (const [id, component] of Object.entries(pkg.components)) {
      assert.ok(labels.components[id], `${pkg.service.id}/${id}`);
      for (const input of [...component.selectors, ...component.usageInputs]) {
        assert.ok(labels.components[id][1]?.[input.id], `${pkg.service.id}/${id}/${input.id}`);
      }
    }
  }
});

test('future service Definitions keep their labels until a Japanese display catalog is supplied', () => {
  const pkg = { service: { id: 'future-service' } };
  assert.equal(japaneseDrawerPackage(pkg), pkg);
});
