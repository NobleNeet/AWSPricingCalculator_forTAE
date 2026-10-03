import { sum, decimal } from '../pricing/decimal.js';

export const newId = prefix => `${prefix}-${globalThis.crypto.randomUUID()}`;
export function newProject() {
  return { schemaVersion: 1, project: { id: newId('project'), name: '新しいAWS見積もり', defaultRegion: 'ap-northeast-1', usageAssumptions: { hoursPerMonth: '730' }, baselinePlanId: null, planOrder: [], rowOrder: [] }, plans: {}, rows: {}, serviceInstances: {} };
}
export function addPlan(state, name) {
  const id = newId('plan'); state.plans[id] = { id, name: name ?? `案 ${state.project.planOrder.length + 1}`, memo: '' }; state.project.planOrder.push(id);
  state.project.baselinePlanId ??= id; return id;
}
export function duplicatePlan(state, sourceId) {
  const source = state.plans[sourceId];
  const id = addPlan(state, `${source.name} の複製`); state.plans[id].memo = source.memo;
  for (const row of Object.values(state.rows)) {
    const original = state.serviceInstances[row.cells[sourceId]];
    if (original) { const copy = structuredClone(original); copy.id = newId('service'); state.serviceInstances[copy.id] = copy; row.cells[id] = copy.id; }
  }
  return id;
}
export function deletePlan(state, id) {
  if (state.project.planOrder.length <= 1) return false;
  for (const rowId of [...state.project.rowOrder]) removeService(state, id, rowId);
  delete state.plans[id]; state.project.planOrder = state.project.planOrder.filter(value => value !== id);
  if (state.project.baselinePlanId === id) state.project.baselinePlanId = state.project.planOrder[0];
  return true;
}
export function placeService(state, planId, instance, rowId) {
  if (!state.plans[planId]) throw Error('Unknown Plan');
  if (!rowId) { rowId = newId('row'); state.rows[rowId] = { id: rowId, label: null, cells: {} }; state.project.rowOrder.push(rowId); }
  const row = state.rows[rowId]; if (!row) throw Error('Unknown Row');
  if (row.cells[planId]) delete state.serviceInstances[row.cells[planId]];
  state.serviceInstances[instance.id] = instance; row.cells[planId] = instance.id;
  return rowId;
}
export function removeService(state, planId, rowId) {
  const row = state.rows[rowId]; if (!row) return;
  delete state.serviceInstances[row.cells[planId]]; delete row.cells[planId];
  if (!Object.keys(row.cells).length) { delete state.rows[rowId]; state.project.rowOrder = state.project.rowOrder.filter(id => id !== rowId); }
}
export function planSummary(state, planId, results) {
  const ids = state.project.rowOrder.map(rowId => state.rows[rowId].cells[planId]).filter(Boolean);
  const calculated = ids.map(id => results.get(id)).filter(result => result?.amountUsd !== undefined && result.amountUsd !== null);
  const uncalculated = ids.length - calculated.length;
  return { amountUsd: sum(calculated.map(result => result.amountUsd)).toString(), uncalculated, complete: uncalculated === 0 };
}
export function planDelta(summary, baseline) { return summary.complete && baseline.complete ? decimal(summary.amountUsd).minus(baseline.amountUsd).toString() : null; }
export function createInstance(pkg, profileId = pkg.service.defaultProfile) {
  const profile = pkg.profiles[profileId];
  const values = inputs => Object.fromEntries(inputs.filter(input => input.default !== undefined).map(input => [input.id, structuredClone(input.default)]));
  return { id: newId('service'), serviceId: pkg.service.id, profileId, region: { mode: 'inherit' }, selectors: values(profile.selectors), components: Object.fromEntries(profile.components.map(id => [id, { enabled: pkg.components[id].defaultEnabled ?? true, inputs: values([...pkg.components[id].selectors, ...pkg.components[id].usageInputs]) }])) };
}
export function serializeProject(state, priceData = {}) {
  const copy = structuredClone(state); copy.savedAt = new Date().toISOString();
  copy.priceData = Object.fromEntries(Object.entries(priceData).filter(([, value]) => value !== undefined && value !== null));
  return JSON.stringify(copy, null, 2);
}
