import { newId, newProject } from './project-store.js';
import { validateSchema } from '../runtime/schema-validation.js';
import { issue } from '../pricing/issues.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function migrateMock(legacy) {
  if (!object(legacy.project) || !Array.isArray(legacy.plans) || !Array.isArray(legacy.rows)) throw Error('Legacy mock structure missing');
  const state = newProject(); state.project.name = legacy.project.name ?? '旧モックから復元'; state.project.defaultRegion = legacy.project.defaultRegion ?? 'ap-northeast-1';
  for (const plan of legacy.plans) { if (!plan.id || Object.hasOwn(state.plans, plan.id)) throw Error('Legacy Plan IDs invalid'); state.plans[plan.id] = { id: plan.id, name: plan.name ?? plan.id, memo: plan.memo ?? '' }; state.project.planOrder.push(plan.id); }
  for (const row of legacy.rows) {
    if (!row.id || Object.hasOwn(state.rows, row.id)) throw Error('Legacy Row IDs invalid');
    const cells = {};
    for (const [planId, cell] of Object.entries(row.cells ?? {})) if (cell) {
      const id = newId('service');
      // Mock settings are retained as opaque legacy input; no inferred pricing translation.
      state.serviceInstances[id] = { id, serviceId: `legacy-${cell.service ?? 'unknown'}`, profileId: 'legacy', region: { mode: 'inherit' }, selectors: {}, components: {}, legacyInput: structuredClone(cell) };
      cells[planId] = id;
    }
    state.rows[row.id] = { id: row.id, label: row.label ?? null, cells }; state.project.rowOrder.push(row.id);
  }
  state.project.baselinePlanId = state.plans[legacy.project.baselinePlanId] ? legacy.project.baselinePlanId : state.project.planOrder[0] ?? null;
  return state;
}
export function restoreProject(text, { schema, packages, currentBuildId, migrations = new Map() } = {}) {
  const issues = [];
  const warning = (code, message, context) => issues.push(issue(code, message, context, 'warning'));
  try {
    let next = JSON.parse(text);
    if (!object(next)) throw Error('Project object required');
    const visited = new Set();
    while (next.schemaVersion !== 1) {
      if (visited.has(next.schemaVersion) || !migrations.has(next.schemaVersion)) throw Error(`Unsupported schemaVersion ${next.schemaVersion}`);
      visited.add(next.schemaVersion); next = migrations.get(next.schemaVersion)(structuredClone(next)); warning('PROJECT_MIGRATED', 'Explicit migration applied');
    }
    if (Array.isArray(next.plans)) { next = migrateMock(next); warning('MOCK_MIGRATED', '旧モック入力を保持しました。料金設定は推測移行せず、各Serviceを置換して再選択してください。'); }
    if (!object(next.project) || !object(next.plans) || !object(next.rows) || !object(next.serviceInstances) || !Array.isArray(next.project.planOrder) || !Array.isArray(next.project.rowOrder)) throw Error('Required Project structure missing');
    if (schema) {
      const errors = validateSchema(schema, next);
      const fatal = errors.filter(error => error.keyword !== 'additionalProperties' && !error.path.startsWith('/serviceInstances/'));
      if (fatal.length) throw Error(`Project schema failure: ${JSON.stringify(fatal)}`);
      errors.forEach(error => warning('RESTORE_SCHEMA_WARNING', error.message, { path: error.path }));
    }
    for (const [kind, order] of [['plans', 'planOrder'], ['rows', 'rowOrder']]) {
      if (next.project[order].some(id => !Object.hasOwn(next[kind], id))) throw Error(`${order} has missing reference`);
      next.project[order] = [...new Set([...next.project[order], ...Object.keys(next[kind])])];
      for (const [id, value] of Object.entries(next[kind])) { if (!object(value)) throw Error(`Invalid ${kind}/${id}`); if (value.id !== id) { value.id = id; warning('ID_REPAIRED', `Aligned ${kind} ID with stable dictionary key`, { path: `${kind}/${id}` }); } }
    }
    const used = new Set();
    for (const row of Object.values(next.rows)) {
      if (!object(row.cells)) throw Error('Invalid Row cells');
      for (const [planId, id] of Object.entries(row.cells)) {
        if (!Object.hasOwn(next.plans, planId) || !Object.hasOwn(next.serviceInstances, id)) throw Error('Unrepairable Row reference');
        if (used.has(id)) { const copy = structuredClone(next.serviceInstances[id]); copy.id = newId('service'); next.serviceInstances[copy.id] = copy; row.cells[planId] = copy.id; warning('SHARED_INSTANCE_SPLIT', 'Service configuration cloned to preserve independent Plans'); }
        used.add(row.cells[planId]);
      }
    }
    if (!next.project.planOrder.length) next.project.baselinePlanId = null;
    else if (!next.project.planOrder.includes(next.project.baselinePlanId)) { next.project.baselinePlanId = next.project.planOrder[0]; warning('BASELINE_REPAIRED', 'Baseline set to first available Plan'); }
    for (const [id, instance] of Object.entries(next.serviceInstances)) {
      if (!object(instance)) throw Error('Invalid Service Instance');
      instance.id = id;
      if (!packages) continue;
      const pkg = packages.get(instance.serviceId);
      if (!pkg) { warning('UNKNOWN_SERVICE', `Unknown/unavailable Service ${instance.serviceId}; data preserved`, { path: `serviceInstances/${id}` }); continue; }
      const profile = pkg.profiles[instance.profileId];
      if (!profile) { warning('UNKNOWN_PROFILE', `Unknown Profile ${instance.profileId}; data preserved`, { path: `serviceInstances/${id}` }); continue; }
      const selectors = new Set(profile.selectors.map(input => input.id));
      for (const key of Object.keys(instance.selectors ?? {})) if (!selectors.has(key)) warning('UNKNOWN_FIELD', `Unknown selector ${key}; preserved`, { path: `serviceInstances/${id}/selectors/${key}` });
      for (const [componentId, component] of Object.entries(instance.components ?? {})) {
        const definition = pkg.components[componentId];
        if (!definition || !profile.components.includes(componentId)) { warning('UNKNOWN_COMPONENT', `Unknown Component ${componentId}; preserved`); continue; }
        const fields = new Set([...definition.selectors, ...definition.usageInputs].map(input => input.id));
        for (const key of Object.keys(component?.inputs ?? {})) if (!fields.has(key)) warning('UNKNOWN_FIELD', `Unknown input ${key}; preserved`);
      }
    }
    if (next.priceData?.buildId && currentBuildId && next.priceData.buildId !== currentBuildId) warning('PRICE_BUILD_CHANGED', `Saved build ${next.priceData.buildId}; recalculating with current ${currentBuildId}`);
    return { fatal: false, project: next, issues };
  } catch (error) { return { fatal: true, project: null, issues: [...issues, issue('RESTORE_FATAL', error.message)] }; }
}
