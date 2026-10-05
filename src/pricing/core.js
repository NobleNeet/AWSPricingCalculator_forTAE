import { enabled } from './conditions.js';
import { decimal, sum } from './decimal.js';
import { matches, fieldValue } from './filter.js';
import { resolvePrice } from './price-query.js';
import { calculate } from './calculation.js';
import { fail, issue } from './issues.js';

export function selectorCandidates(selector, products, context, fixedFilters = []) {
  if (selector.options.values) return [...selector.options.values];
  const filtered = products.filter(product => matches(product, [...fixedFilters, ...(selector.options.filters ?? [])], context));
  return [...new Set(filtered.map(product => fieldValue(product, `attributes.${selector.options.attribute}`).value).filter(v => v !== undefined))].sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));
}
export function activeInputs(inputs, saved, context, products, filters, namespace = 'component') {
  const active = {};
  const ordered = [], visiting = new Set(), visited = new Set();
  const visit = input => {
    if (visiting.has(input.id)) fail('DEPENDENCY_CYCLE', `Cycle at ${input.id}.`);
    if (visited.has(input.id)) return;
    visiting.add(input.id);
    const references = JSON.stringify({ enabledWhen: input.enabledWhen, options: input.options });
    for (const dependency of inputs) if (references.includes(`\"${namespace}.${dependency.id}\"`)) visit(dependency);
    visiting.delete(input.id); visited.add(input.id); ordered.push(input);
  };
  inputs.forEach(visit);
  context[namespace] = active;
  for (const input of ordered) {
    if (!enabled(input.enabledWhen, context)) continue;
    const hasSavedValue = Object.prototype.hasOwnProperty.call(saved, input.id);
    const value = hasSavedValue ? saved[input.id] : input.default;
    if (value === undefined) fail('MISSING_INPUT', `Input ${input.id} is required.`);
    if (input.type === 'select') {
      const valid = input.options.values ? input.options.values.includes(value) : products.some(product => fieldValue(product, `attributes.${input.options.attribute}`).value === value && matches(product, [...filters, ...(input.options.filters ?? [])], context));
      if (!valid) fail('RESELECT_REQUIRED', `要再選択: ${input.label}`);
    }
    if (input.type === 'number') {
      const amount = decimal(value);
      if (amount.isNegative() || input.minimum !== undefined && amount.lt(input.minimum) || input.maximum !== undefined && amount.gt(input.maximum)) fail('INVALID_INPUT', `Invalid usage: ${input.label}`);
    }
    if (input.type === 'boolean' && typeof value !== 'boolean') fail('INVALID_INPUT', `Invalid boolean: ${input.label}`);
    active[input.id] = value;
  }
  return active;
}
export function evaluateService(pkg, instance, project, products, profileProducts = products) {
  const components = {};
  const issues = [];
  try {
    const profile = pkg.profiles[instance.profileId];
    if (!profile) fail('UNKNOWN_PROFILE', 'Unknown profile.');
    const context = { project, profile: instance.selectors ?? {}, component: {} };
    context.profile = activeInputs(profile.selectors, context.profile, context, profileProducts, profile.fixedFilters, 'profile');
    for (const id of profile.components) {
      const definition = pkg.components[id];
      const saved = instance.components?.[id] ?? {};
      const componentEnabled = saved.enabled ?? definition.defaultEnabled ?? true;
      if (!enabled(definition.enabledWhen, context) || definition.optional && componentEnabled === false) { components[id] = { state: 'disabled', issues: [] }; continue; }
      try {
        context.component = saved.inputs ?? {};
        const filters = [...profile.fixedFilters, ...definition.fixedFilters];
        const broadFilters = [...filters, ...definition.priceQuery.productFilters.filter(f => !f.valueFrom?.startsWith('component.'))];
        const scopedProducts = products.filter(product => matches(product, broadFilters, context));
        context.component = activeInputs([...definition.selectors, ...definition.usageInputs], context.component, context, scopedProducts, broadFilters);
        const resolution = resolvePrice(scopedProducts, definition.priceQuery, context, filters);
        const limitations = [...new Set([...definition.limitations, ...resolution.limitations])];
        const result = calculate(definition.calculation, context, resolution.dimension);
        components[id] = { ...result, state: limitations.length ? 'warning' : 'ready', limitations, resolution };
      } catch (error) {
        const diagnostic = error.issue ?? issue('INVALID_DATA', error.message);
        components[id] = { state: 'invalid', issues: [diagnostic] };
        issues.push({ ...diagnostic, componentId: id });
      }
    }
  } catch (error) { issues.push(error.issue ?? issue('INVALID_DATA', error.message)); }
  const incomplete = issues.some(i => i.severity === 'error');
  return { state: incomplete ? 'invalid' : Object.values(components).some(c => c.state === 'warning') ? 'warning' : 'ready', amountUsd: incomplete ? null : sum(Object.values(components).filter(c => c.amountUsd !== undefined).map(c => c.amountUsd)).toString(), components, issues };
}
