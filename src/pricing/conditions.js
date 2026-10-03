import { compare, resolveValue } from './filter.js';

export function enabled(condition, context) {
  if (condition === undefined) return true;
  const keys = ['all', 'any', 'not', 'op'].filter(key => Object.hasOwn(condition, key));
  if (keys.length !== 1) throw new TypeError('One condition operator required');
  if ('all' in condition) return condition.all.every(child => enabled(child, context));
  if ('any' in condition) return condition.any.some(child => enabled(child, context));
  if ('not' in condition) return !enabled(condition.not, context);
  return compare(resolveValue({ valueFrom: condition.field }, context), condition, context);
}
