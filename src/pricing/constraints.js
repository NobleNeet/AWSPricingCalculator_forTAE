import { enabled } from './conditions.js';
import { resolveUsageSource } from './calculation.js';
import { fail } from './issues.js';

export function validateConstraints(constraints = [], context) {
  for (const constraint of constraints) {
    if (!enabled(constraint.when, context)) continue;
    const left = resolveUsageSource(constraint.left, context), right = resolveUsageSource(constraint.right, context);
    const valid = constraint.op === 'gte' ? left.gte(right)
      : constraint.op === 'lte' ? left.lte(right)
      : constraint.op === 'zeroOrPositive' ? left.isZero() || right.gt('0')
      : constraint.op === 'multipleOf' ? right.gt('0') && left.mod(right).isZero()
      : false;
    if (!valid) fail('INVALID_INPUT_COMBINATION', constraint.message);
  }
}
