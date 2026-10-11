import { fieldValue, matches, resolveValue } from '../../src/pricing/filter.js';
import { mappingForComponent } from '../../src/pricing/mapping.js';

export function packageWithDependencies(pkg, profileId, targetId) {
  const profile = pkg.profiles[profileId], needed = new Set();
  const visit = id => {
    if (needed.has(id)) return;
    if (!profile.components.includes(id)) throw new Error(`Drift dependency ${id} is outside profile ${profileId}.`);
    needed.add(id);
    const walk = value => {
      if (!value || typeof value !== 'object') return;
      if (['resolvedComponentInput', 'resolvedComponentAttribute'].includes(value.type)) visit(value.componentId);
      for (const child of Object.values(value)) walk(child);
    };
    walk(pkg.components[id]);
  };
  visit(targetId);
  return { ...pkg, profiles: { ...pkg.profiles, [profileId]: { ...profile, components: profile.components.filter(id => needed.has(id)) } } };
}

// Indexes only reduce scans. The original predicate checks every returned
// product; Core still validates inputs, dimensions and singleSku resolution.
export function productMatcher(products) {
  const indexes = new Map();
  const index = field => {
    if (!indexes.has(field)) {
      const values = new Map();
      for (const product of products) {
        const actual = fieldValue(product, field);
        if (!actual.exists) continue;
        const entries = values.get(actual.value) ?? [];
        entries.push(product); values.set(actual.value, entries);
      }
      indexes.set(field, values);
    }
    return indexes.get(field);
  };
  return (filters, context) => {
    const known = filters.filter(filter => !filter.valueFrom || fieldValue(context, filter.valueFrom).exists);
    let candidates = products;
    for (const filter of known) {
      if (!['eq', 'in'].includes(filter.op)) continue;
      const values = filter.op === 'in' ? filter.value : [resolveValue(filter, context).value];
      const subset = [...new Set(values.flatMap(value => index(filter.field).get(value) ?? []))];
      if (subset.length < candidates.length) candidates = subset;
    }
    return candidates.filter(product => matches(product, known, context));
  };
}

export function productsForCase(pkg, instance, project, matchProducts) {
  const profile = pkg.profiles[instance.profileId], products = new Set(), profileProducts = new Set();
  const profileContext = { project, profile: instance.selectors ?? {}, component: {} };
  const selectors = (inputs, filters, context, destination) => {
    for (const input of inputs) {
      if (!input.options?.attribute) continue;
      const namespace = destination === profileProducts ? context.profile : context.component;
      const value = namespace[input.id] ?? input.default;
      const selected = value === undefined ? [] : [{ field: `attributes.${input.options.attribute}`, op: 'eq', value }];
      for (const product of matchProducts([...filters, ...(input.options.filters ?? []), ...selected], context)) destination.add(product);
    }
  };
  selectors(profile.selectors, profile.fixedFilters, profileContext, profileProducts);
  for (const id of profile.components) {
    const component = pkg.components[id], mapping = mappingForComponent(pkg, id);
    const context = { ...profileContext, component: instance.components[id]?.inputs ?? {} };
    const filters = mapping ? mapping.productMatchers : [...profile.fixedFilters, ...component.fixedFilters, ...component.priceQuery.productFilters];
    for (const product of matchProducts(filters, context)) products.add(product);
    selectors([...component.selectors, ...component.usageInputs], filters.filter(filter => !filter.valueFrom?.startsWith('component.')), context, products);
  }
  return { products: [...products], profileProducts: [...profileProducts] };
}
