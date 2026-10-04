import { evaluateService, selectorCandidates } from '../../src/pricing/core.js';
import { enabled } from '../../src/pricing/conditions.js';
import { issue } from '../../src/pricing/issues.js';
import { inventory, validateCoverage } from './inventory.js';
import { matches } from '../../src/pricing/filter.js';

export const COVERAGE_REFERENCE_REGION = 'ap-northeast-1';

export function defaults(pkg, profileId = pkg.service.defaultProfile) {
  const profile = pkg.profiles[profileId];
  return { serviceId: pkg.service.id, profileId, region: { mode: 'inherit' }, selectors: Object.fromEntries(profile.selectors.filter(input => input.default !== undefined).map(input => [input.id, input.default])), components: Object.fromEntries(profile.components.map(id => [id, { enabled: pkg.components[id].defaultEnabled ?? true, inputs: Object.fromEntries([...pkg.components[id].selectors, ...pkg.components[id].usageInputs].filter(input => input.default !== undefined).map(input => [input.id, input.default])) }])) };
}
export function inputOrder(inputs, namespace) {
  const ordered = [], seen = new Set();
  const visit = input => {
    if (seen.has(input.id)) return;
    seen.add(input.id);
    const json = JSON.stringify(input);
    for (const dependency of inputs) if (json.includes(`\"${namespace}.${dependency.id}\"`)) visit(dependency);
    ordered.push(input);
  };
  inputs.forEach(visit);
  return ordered;
}
function branches(inputs, namespace, context, products, filters) {
  let contexts = [context];
  for (const input of inputOrder(inputs, namespace)) {
    const next = [];
    for (const current of contexts) {
      if (!enabled(input.enabledWhen, current) || input.type !== 'select') { next.push(current); continue; }
      for (const value of selectorCandidates(input, products, current, filters)) next.push({ ...current, [namespace]: { ...current[namespace], [input.id]: value } });
    }
    contexts = next;
  }
  return contexts;
}
function conditionValues(condition, field, values = []) {
  if (!condition) return values;
  if (Array.isArray(condition.all)) for (const child of condition.all) conditionValues(child, field, values);
  if (Array.isArray(condition.any)) for (const child of condition.any) conditionValues(child, field, values);
  if (condition.not) conditionValues(condition.not, field, values);
  if (condition.field === field && Object.hasOwn(condition, 'value')) {
    if (Array.isArray(condition.value)) values.push(...condition.value);
    else values.push(condition.value);
  }
  return values;
}
function numericCandidates(input, condition) {
  const values = new Set();
  const add = value => {
    if (value === undefined || value === null || value === '') return;
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    if (input.minimum !== undefined && number < Number(input.minimum)) return;
    if (input.maximum !== undefined && number > Number(input.maximum)) return;
    values.add(String(value));
  };
  add(input.default);
  for (const value of conditionValues(condition, `profile.${input.id}`)) add(value);
  add(input.minimum);
  add(input.maximum);
  add('0');
  add('1');
  return [...values];
}
function componentContexts(profile, component, context) {
  if (enabled(component.enabledWhen, context)) return [context];
  const conditionText = JSON.stringify(component.enabledWhen ?? null);
  const probes = profile.selectors.filter(input => input.type === 'number' && conditionText.includes(`\"profile.${input.id}\"`));
  if (!probes.length) return [];
  let contexts = [context];
  for (const input of probes) {
    const next = [];
    for (const current of contexts) {
      if (!enabled(input.enabledWhen, current)) { next.push(current); continue; }
      for (const value of numericCandidates(input, component.enabledWhen)) next.push({ ...current, profile: { ...current.profile, [input.id]: value } });
    }
    contexts = next;
  }
  return contexts.filter(current => enabled(component.enabledWhen, current));
}
export function reachableCases(pkg, products, region = 'ap-northeast-1') {
  const cases = [];
  for (const profileId of pkg.service.profiles) {
    const profile = pkg.profiles[profileId];
    const instance = defaults(pkg, profileId);
    const base = { project: { region, defaultRegion: region, hoursPerMonth: '730' }, profile: instance.selectors, component: {} };
    for (const context of branches(profile.selectors, 'profile', base, products, profile.fixedFilters)) {
      for (const componentId of profile.components) {
        const component = pkg.components[componentId];
        for (const componentContext of componentContexts(profile, component, context)) {
          const start = { ...componentContext, component: instance.components[componentId].inputs };
          const filters = [...profile.fixedFilters, ...component.fixedFilters, ...component.priceQuery.productFilters.filter(f => !f.valueFrom?.startsWith('component.'))];
          const scopedProducts = products.filter(product => matches(product, filters, componentContext));
          for (const branch of branches(component.selectors, 'component', start, scopedProducts, filters)) {
            const sample = structuredClone(instance);
            sample.selectors = branch.profile;
            sample.components[componentId].inputs = branch.component;
            const narrow = { ...pkg, profiles: { ...pkg.profiles, [profileId]: { ...profile, components: [componentId] } } };
            sample.components[componentId].enabled = true;
            cases.push({ pkg: narrow, instance: sample, project: base.project, componentId, products: scopedProducts });
          }
        }
      }
    }
  }
  return cases;
}
export function validatePriceData(packages, data, common, normalizers, options = {}) {
  const { includeCoverage = true } = options;
  const issues = [], coverage = {}, resolutions = [];
  for (const pkg of packages) {
    const code = pkg.service.priceSource.serviceCode;
    const sources = Object.entries(data).filter(([, source]) => source.serviceCode === code);
    if (!sources.length) { issues.push(issue('PRICE_SOURCE_NOT_FOUND', 'Price source missing.', { serviceId: pkg.service.id })); continue; }
    if (includeCoverage) {
      const coverageSource = sources.find(([, source]) => source.region === COVERAGE_REFERENCE_REGION) ?? sources[0];
      const [, coverageData] = coverageSource;
      const categories = inventory(coverageData, common, normalizers[coverageData.serviceCode]);
      const checked = validateCoverage(categories, pkg.coverage);
      coverage[`${pkg.service.id}/${coverageData.region}`] = checked.summary;
      issues.push(...checked.issues.map(i => ({ ...i, serviceId: pkg.service.id, region: coverageData.region })));
    }
    for (const [sourceKey, source] of sources) {
      const cases = reachableCases(pkg, source.products, source.region);
      if (!cases.length) issues.push(issue('NO_REACHABLE_SELECTOR', 'No reachable selector branch.', { serviceId: pkg.service.id, region: source.region }));
      for (const sample of cases) {
        const result = evaluateService(sample.pkg, sample.instance, sample.project, sample.products);
        issues.push(...result.issues.map(i => ({ ...i, serviceId: pkg.service.id, profileId: sample.instance.profileId, region: source.region })));
        resolutions.push({ serviceId: pkg.service.id, profileId: sample.instance.profileId, componentId: sample.componentId, instance: sample.instance, result, region: source.region, sourceKey });
      }
      for (const profileId of pkg.service.profiles) {
        const result = evaluateService(pkg, defaults(pkg, profileId), { region: source.region, defaultRegion: source.region, hoursPerMonth: '730' }, source.products);
        issues.push(...result.issues.map(i => ({ ...i, serviceId: pkg.service.id, profileId, region: source.region })));
      }
    }
  }
  return { issues, coverage, resolutions };
}
