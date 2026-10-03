export const operators = ['eq', 'neq', 'in', 'notIn', 'exists', 'notExists'];
export function fieldValue(object, path) {
  const parts = path.split('.');
  let value = object;
  for (const part of parts) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) return { exists: false };
    value = value[part];
  }
  return { exists: true, value };
}
export function resolveValue(spec, context) {
  if (Object.hasOwn(spec, 'value') && Object.hasOwn(spec, 'valueFrom')) throw new TypeError('value and valueFrom are exclusive');
  if (Object.hasOwn(spec, 'value')) return { exists: true, value: spec.value };
  if (!/^(project|profile|component)\.[a-zA-Z][a-zA-Z0-9-]*$/.test(spec.valueFrom ?? '')) throw new TypeError('Invalid valueFrom');
  return fieldValue(context, spec.valueFrom);
}
export function compare(actual, spec, context = {}) {
  if (!operators.includes(spec.op)) throw new TypeError('Unknown operator');
  if (spec.op === 'exists') return actual.exists;
  if (spec.op === 'notExists') return !actual.exists;
  if (spec.op === 'in' || spec.op === 'notIn') {
    if (!Array.isArray(spec.value) || Object.hasOwn(spec, 'valueFrom')) throw new TypeError('Membership requires static array');
    return actual.exists && (spec.op === 'in' ? spec.value.some(v => v === actual.value) : !spec.value.some(v => v === actual.value));
  }
  const expected = resolveValue(spec, context);
  return actual.exists && expected.exists && (spec.op === 'eq' ? actual.value === expected.value : actual.value !== expected.value);
}
export function matches(object, filters = [], context = {}) {
  return filters.every(filter => compare(fieldValue(object, filter.field), filter, context));
}
