import { decimal } from './decimal.js';
import { resolveValue } from './filter.js';
import { fail } from './issues.js';
import { tierAmount } from './tiers.js';

function canonicalUnit(unit) {
  if (unit === 'Requests') return 'Request';
  if (unit === 'GB-month') return 'GB-Mo';
  return unit;
}

export function resolveUsageSource(source, context, depth = 0) {
  if (depth > 16) fail('INVALID_CALCULATION', 'Usage expression nesting limit exceeded.');
  if (source.value && typeof source.value === 'object' && !Array.isArray(source.value)) {
    const expression = source.value;
    if (expression.type === 'product') {
      if (!Array.isArray(expression.sources) || !expression.sources.length) fail('INVALID_CALCULATION', 'Invalid usage product.');
      return expression.sources.reduce((value, factor) => value.times(resolveUsageSource(factor, context, depth + 1)), decimal('1'));
    }
    if (expression.type === 'maximum') {
      if (!Array.isArray(expression.sources) || expression.sources.length === 0) {
        fail('INVALID_CALCULATION', 'Maximum usage expression requires nonempty sources.');
      }
      return expression.sources.reduce((max, source) => {
        const current = resolveUsageSource(source, context, depth + 1);
        return max === null || current.gt(max) ? current : max;
      }, null);
    }
    if (expression.type === 'choice') {
      const selection = resolveValue({ valueFrom: expression.field }, context);
      if (!selection.exists || !Object.prototype.hasOwnProperty.call(expression.cases ?? {}, selection.value)) fail('MISSING_USAGE', `Missing usage choice ${expression.field}.`);
      return resolveUsageSource(expression.cases[selection.value], context, depth + 1);
    }
    if (expression.type === 'resolvedComponentInput') {
      const raw = context.resolvedInputs?.[expression.componentId]?.[expression.inputId];
      if (raw === undefined) fail('MISSING_USAGE', `Missing resolved input ${expression.componentId}.${expression.inputId}.`);
      const value = decimal(raw);
      if (value.isNegative()) fail('INVALID_USAGE', 'Usage must be nonnegative.');
      return value;
    }
    if (expression.type === 'resolvedComponentAttribute') {
      const component = context.resolvedComponents?.[expression.componentId];
      const raw = component?.attributes?.[expression.attribute];
      if (typeof raw !== 'string' && typeof raw !== 'number') fail('MISSING_USAGE', `Missing resolved ${expression.componentId}.${expression.attribute}.`);
      if (!/^[0-9]+(?:\\.[0-9]+)?$/.test(String(raw).trim())) fail('INVALID_USAGE', `Invalid numeric resolved attribute ${expression.componentId}.${expression.attribute}.`);
      return decimal(raw);
    }
    if (expression.type !== 'transformed' || (typeof expression.valueFrom !== 'string' && !expression.source) || !Array.isArray(expression.transforms)) {
      fail('INVALID_CALCULATION', 'Invalid transformed usage source.');
    }
    let value = expression.source ? resolveUsageSource(expression.source, context, depth + 1) : resolveUsageSource({ valueFrom: expression.valueFrom }, context, depth + 1);
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
        case 'maximum': {
          const maximum = decimal(transform.value);
          if (maximum.isNegative()) fail('INVALID_TRANSFORM', 'Negative maximum.');
          value = value.gt(maximum) ? maximum : value;
          break;
        }
        case 'divide': {
          const divisor = decimal(transform.divisor);
          if (!divisor.gt('0')) fail('INVALID_TRANSFORM', 'Divisor must be positive.');
          value = value.div(divisor);
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

export function calculate(calculation, context, dimension, dimensions = [dimension]) {
  if (!['unit', 'tiered'].includes(calculation.model) || calculation.usage.combine !== 'multiply' || !calculation.usage.sources.length) fail('INVALID_CALCULATION', 'Unsupported calculation model or usage.');
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
  const amount = calculation.model === 'tiered' ? tierAmount(quantity, dimensions) : quantity.times(price);
  return { rawUsage: rawUsage.toString(), billingQuantity: quantity.toString(), billingUnit: dimension.unit, unitPriceUsd: price.toString(), amountUsd: amount.toString(), issues: [] };
}
