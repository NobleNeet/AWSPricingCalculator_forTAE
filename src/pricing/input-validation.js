import { decimal } from './decimal.js';

// Return a message rather than touching DOM or throwing: browser and Pricing Core
// use the same contract, including estimates restored from saved JSON.
export function numberInputError(input, value) {
  let amount;
  try { amount = decimal(value); } catch { return `${input.label}: 有限の数値を入力してください。`; }
  if (amount.isNegative()) return `${input.label}: 0以上の値を入力してください。`;
  if (input.minimum !== undefined && amount.lt(input.minimum)) return `${input.label}: ${input.minimum}以上の値を入力してください。`;
  if (input.exclusiveMinimum !== undefined && amount.lte(input.exclusiveMinimum)) return `${input.label}: ${input.exclusiveMinimum}より大きい値を入力してください。`;
  if (input.maximum !== undefined && amount.gt(input.maximum)) return `${input.label}: ${input.maximum}以下の値を入力してください。`;
  if (input.integer && !amount.isInteger()) return `${input.label}: 整数を入力してください。`;
  return null;
}
