import path from 'node:path';
import { schemaValidator } from '../schema.js';
import { issue } from '../../src/pricing/issues.js';
import { decimal } from '../../src/pricing/decimal.js';
import { readJson } from './package-loader.js';

function references(object, result = []) {
  if (!object || typeof object !== 'object') return result;
  if (typeof object.valueFrom === 'string') result.push(object.valueFrom);
  if (typeof object.field === 'string' && /^(project|profile|component)\./.test(object.field)) result.push(object.field);
  for (const value of Object.values(object)) references(value, result);
  return result;
}
export async function validateDefinitions(packages) {
  const validators = Object.fromEntries(await Promise.all(['service', 'profile', 'component', 'coverage', 'golden'].map(async name => [name, await schemaValidator(`service-definition/${name}`)])));
  const issues = [];
  const limitationIds = new Set((await readJson('pricing/limitations.json')).limitations.map(item => item.id));
  for (const pkg of packages) {
    const add = (code, message, extra = {}) => issues.push(issue(code, message, { serviceId: pkg.service?.id, ...extra }));
    let schemaValid = true;
    for (const [kind, definitions] of [['service', { service: pkg.service }], ['profile', pkg.profiles], ['component', pkg.components], ['coverage', { coverage: pkg.coverage }], ['golden', Object.fromEntries(pkg.golden.map((g, i) => [i, g]))]]) {
      for (const [key, definition] of Object.entries(definitions)) {
        if (!validators[kind](definition)) { schemaValid = false; add('SCHEMA_ERROR', `${kind}/${key}: ${JSON.stringify(validators[kind].errors)}`, { path: `${kind}/${key}` }); }
        if (['profile', 'component'].includes(kind) && key !== definition?.id) add('FILE_ID_MISMATCH', `${key} differs from ${definition?.id}.`);
      }
    }
    if (!schemaValid) continue;
    if (pkg.directory && path.basename(pkg.directory) !== pkg.service.id) add('FILE_ID_MISMATCH', 'Service directory differs from id.');
    if (!pkg.service.profiles?.includes(pkg.service.defaultProfile)) add('INVALID_DEFAULT', 'Default profile is not declared.');
    const usedComponents = new Set();
    for (const id of pkg.service.profiles ?? []) if (!pkg.profiles[id]) add('MISSING_PROFILE', `Missing profile ${id}.`);
    for (const [id, profile] of Object.entries(pkg.profiles)) {
      if (!pkg.service.profiles?.includes(id)) add('ORPHAN_DEFINITION', `Unreferenced profile ${id}.`);
      for (const componentId of profile.components ?? []) {
        usedComponents.add(componentId);
        if (!pkg.components[componentId]) add('MISSING_COMPONENT', `Missing component ${componentId}.`);
      }
      const profileIds = new Set((profile.selectors ?? []).map(input => input.id));
      const checkScope = (inputs, definition, componentId) => {
        const ids = new Set();
        const nodes = new Map();
        for (const input of inputs) {
          if (ids.has(input.id)) add('DUPLICATE_INPUT_ID', `Duplicate ${input.id}.`, { profileId: id, componentId });
          ids.add(input.id);
          nodes.set(`${componentId ? 'component' : 'profile'}.${input.id}`, references(input));
          if (input.default !== undefined) {
            try {
              if (input.type === 'number') {
                const value = decimal(input.default);
                if (value.isNegative() || input.minimum !== undefined && value.lt(input.minimum) || input.maximum !== undefined && value.gt(input.maximum)) throw Error('Range');
              }
              if (input.type === 'boolean' && typeof input.default !== 'boolean') throw Error('Type');
              if (input.type === 'select' && input.options?.values && !input.options.values.includes(input.default)) throw Error('Candidate');
            } catch { add('INVALID_DEFAULT', `Invalid default for ${input.id}.`); }
          }
        }
        for (const valueFrom of references(definition)) {
          const [namespace, key] = valueFrom.split('.');
          if (namespace === 'project' && !['region', 'hoursPerMonth', 'defaultRegion'].includes(key) || namespace === 'profile' && !profileIds.has(key) || namespace === 'component' && (!componentId || !ids.has(key))) add('INVALID_REFERENCE', `Unknown reference ${valueFrom}.`, { profileId: id, componentId });
        }
        const visiting = new Set(), visited = new Set();
        const visit = node => {
          if (visiting.has(node)) { add('DEPENDENCY_CYCLE', `Cycle at ${node}.`); return; }
          if (visited.has(node)) return;
          visiting.add(node);
          for (const dependency of nodes.get(node) ?? []) if (nodes.has(dependency)) visit(dependency);
          visiting.delete(node); visited.add(node);
        };
        for (const node of nodes.keys()) visit(node);
      };
      checkScope(profile.selectors ?? [], profile);
      for (const componentId of profile.components ?? []) {
        const component = pkg.components[componentId];
        if (component) checkScope([...(component.selectors ?? []), ...(component.usageInputs ?? [])], component, componentId);
      }
    }
    for (const componentId of Object.keys(pkg.components)) if (!usedComponents.has(componentId)) add('ORPHAN_DEFINITION', `Unreferenced component ${componentId}.`);
    for (const component of Object.values(pkg.components)) for (const id of component.limitations ?? []) if (!limitationIds.has(id)) add('UNKNOWN_LIMITATION', `Unknown limitation ${id}.`);
    for (const category of pkg.coverage?.categories ?? []) {
      if (category.status === 'mapped' && !pkg.components[category.componentId]) add('INVALID_REFERENCE', `Coverage references ${category.componentId}.`);
      if (category.status === 'unresolved') add('UNMAPPED_PRICING_CATEGORY', 'Unresolved coverage entry.');
    }
  }
  return issues;
}
