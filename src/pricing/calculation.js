import { decimal } from './decimal.js';
import { resolveValue } from './filter.js';
import { fail } from './issues.js';

function canonicalUnit(unit) {
  if (unit === 'Requests') return 'Request';
  if (unit === 'GB-month') return 'GB-Mo';
  return unit;
}

function resolveUsageSource(source, context) {
  if (source.value && typeof source.value === 'object' && !Array.isArray(source.value)) {
    const expression = source.value;
    if (expression.type !== 'transformed' || typeof expression.valueFrom !== 'string' || !Array.isArray(expression.transforms)) {
      fail('INVALID_CALCULATION', 'Invalid transformed usage source.');
    }
    const resolved = resolveValue({ valueFrom: expression.valueFrom }, context);
    if (!resolved.exists) fail('MISSING_USAGE', `Missing ${expression.valueFrom}.`);
    let value = decimal(resolved.value);
    if (value.isNegative()) fail('INVALID_USAGE', 'Usage must be nonnegative.');
    for (const transform of expression.transforms) {
      switch (transform.type) {
        case 'subtract':
          value = value.minus(decimal(transform.value));
          break;
        case 'minimum': {
          const minimum = decimal(transform.value);
          if (minimum.isNegative()) fail('INVALID_TRANSFORM', 'Negative minimum.');
          value = value.lt(minimum) ? minimum : value;
          break;
        }
        case 'scale': {
          const factor = decimal(transform.factor);
          if (!factor.gt('0')) fail('INVALID_TRANSFORM', 'Factor must be positive.');
          value = value.times(factor);
          break;
        }
        case 'rounding':
          if (transform.mode !== 'ceil') fail('INVALID_TRANSFORM', 'Only ceil is supported.');
          value = value.ceil();
          break;
        default:
          fail('INVALID_TRANSFORM', 'Unknown source transform.');
      }
    }
    if (value.isNegative()) fail('INVALID_USAGE', 'Transformed usage must be nonnegative.');
    return value;
  }
  const resolved = resolveValue(source, context);
  if (!resolved.exists) fail('MISSING_USAGE', `Missing ${source.valueFrom}.`);
  const value = decimal(resolved.value);
  if (value.isNegative()) fail('INVALID_USAGE', 'Usage must be nonnegative.');
  return value;
}

export function calculate(calculation, context, dimension) {
  if (calculation.model !== 'unit' || calculation.usage.combine !== 'multiply' || !calculation.usage.sources.length) fail('INVALID_CALCULATION', 'Unsupported calculation model or usage.');
  let rawUsage = decimal('1');
  for (const source of calculation.usage.sources) {
    rawUsage = rawUsage.times(resolveUsageSource(source, context));
  }
  let quantity = rawUsage;
  let convertedUnit;
  for (const transform of calculation.transforms) {
    switch (transform.type) {
      case 'minimum': {
        const minimum = decimal(transform.value);
        if (minimum.isNegative()) fail('INVALID_TRANSFORM', 'Negative minimum.');
        quantity = quantity.lt(minimum) ? minimum : quantity;
        break;
      }
      case 'increment': {
        const increment = decimal(transform.value);
        if (!increment.gt('0')) fail('INVALID_TRANSFORM', 'Increment must be positive.');
        quantity = quantity.div(increment).ceil().times(increment);
        break;
      }
      case 'rounding':
        if (transform.mode !== 'ceil') fail('INVALID_TRANSFORM', 'Only ceil is supported.');
        quantity = quantity.ceil();
        break;
      case 'scale':
      case 'unitConversion': {
        if (transform.type === 'unitConversion') {
          if (convertedUnit && convertedUnit !== transform.from) fail('INVALID_TRANSFORM', 'Unit conversion chain mismatch.');
          convertedUnit = transform.to;
        }
        const factor = decimal(transform.factor);
        if (!factor.gt('0')) fail('INVALID_TRANSFORM', 'Factor must be positive.');
        quantity = quantity.times(factor);
        break;
      }
      default: fail('INVALID_TRANSFORM', 'Unknown transform.');
    }
  }
  if (convertedUnit && convertedUnit !== calculation.outputUnit) fail('UNIT_MISMATCH', 'Final conversion unit differs from outputUnit.');
  if (canonicalUnit(calculation.outputUnit) !== canonicalUnit(dimension.unit)) fail('UNIT_MISMATCH', `Expected ${calculation.outputUnit}, received ${dimension.unit}.`);
  const price = decimal(dimension.pricePerUnit.USD);
  return { rawUsage: rawUsage.toString(), billingQuantity: quantity.toString(), billingUnit: dimension.unit, unitPriceUsd: price.toString(), amountUsd: quantity.times(price).toString(), issues: [] };
}
