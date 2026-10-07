import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('Systems Manager drawer follows the supplied Calculator contract', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'systems-manager');
  assert.ok(pkg);

  const profile = pkg.profiles.standard;
  assert.equal(profile.selectors.find(x => x.id === 'managedNodeHours').default, '0');
  assert.equal(profile.selectors.find(x => x.id === 'responsePlanCount').default, '0');
  assert.equal(profile.selectors.find(x => x.id === 'responsePlanHoursPerPlan').default, '730');
  assert.equal(profile.selectors.find(x => x.id === 'responsePlanHoursPerPlan').maximum, '730');

  const jit = pkg.components['jit-node-hours'];
  assert.equal(jit.priceQuery.productFilters.find(x => x.field === 'operation').value, 'JustInTimeAccessHour');
  assert.equal(jit.priceQuery.productFilters.find(x => x.field === 'attributes.trial').value, 'FALSE');
  assert.deepEqual(jit.limitations, ['tier-pricing', 'free-tier', 'account-specific-discount']);

  const incident = pkg.components['incident-response-plans'];
  assert.equal(incident.priceQuery.productFilters.find(x => x.field === 'attributes.response').value, 'response-plan-months');
  assert.equal(
    incident.calculation.usage.sources[1].value.transforms[0].factor,
    '0.001369863013698630136986301369863'
  );
});
