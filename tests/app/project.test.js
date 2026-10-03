import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, addPlan, duplicatePlan, deletePlan, placeService, removeService, createInstance, planSummary, planDelta, serializeProject } from '../../src/app/project-store.js';
import { loadPackage } from '../../tools/pricing-cli/package-loader.js';
import { schemaValidator } from '../../tools/schema.js';

test('0 Plan, stable rows, independent deep duplication, replacement and deletion', async () => {
  const state = newProject(); assert.equal(state.project.planOrder.length, 0);
  const first = addPlan(state), pkg = await loadPackage('services/ec2');
  const instance = createInstance(pkg), row = placeService(state, first, instance);
  const second = duplicatePlan(state, first), copy = state.serviceInstances[state.rows[row].cells[second]];
  copy.components.instance.inputs.hours = '1';
  assert.equal(instance.components.instance.inputs.hours, '730');
  const replacement = createInstance(await loadPackage('services/lambda'));
  placeService(state, second, replacement, row);
  assert.equal(state.serviceInstances[copy.id], undefined);
  assert.equal(state.rows[row].cells[first], instance.id);
  assert.equal(deletePlan(state, first), true); assert.equal(state.project.baselinePlanId, second);
  assert.equal(deletePlan(state, second), false);
  removeService(state, second, row); assert.equal(state.project.rowOrder.length, 0);
  const exported = JSON.parse(serializeProject(state)); assert.equal(exported.schemaVersion, 1);
  const validate = await schemaValidator('project'); assert.equal(validate(exported), true, JSON.stringify(validate.errors));
});
test('incomplete subtotal and exact unrounded delta', () => {
  const state = newProject(), first = addPlan(state), second = addPlan(state);
  placeService(state, first, { id: 'service-a' }); placeService(state, first, { id: 'service-b' });
  placeService(state, second, { id: 'service-c' });
  const results = new Map([['service-a', { amountUsd: '0.004' }], ['service-b', { amountUsd: null, state: 'unavailable' }], ['service-c', { amountUsd: '0.008' }]]);
  const a = planSummary(state, first, results), b = planSummary(state, second, results);
  assert.deepEqual(a, { amountUsd: '0.004', uncalculated: 1, complete: false }); assert.equal(planDelta(b, a), null);
  results.set('service-b', { amountUsd: '0.002' }); assert.equal(planDelta(b, planSummary(state, first, results)), '0.002');
});
