import { sum, decimal } from './decimal.js';
import { tierAmount } from './tiers.js';

// Pure Plan accounting. Entries must be in the visible row order; alternative
// Plans have independent allowances and meter totals. Never mutate raw results.
export function applyPlanBilling(entries, assumptions = {}) {
  const output = new Map(entries.map(entry => [entry.id, structuredClone(entry.result)]));
  const groups = new Map();
  for (const entry of entries) {
    if (entry.result?.amountUsd == null) continue;
    for (const [componentId, component] of Object.entries(entry.result.components ?? {})) {
      const group = component.billingGroup;
      if (!group || component.amountUsd === undefined) continue;
      const key = JSON.stringify([entry.planId, group.scope === 'plan-region' ? entry.region : '', group.id]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ entry, componentId, component, group });
    }
  }
  for (const members of groups.values()) {
    const policy = members[0].group.policy;
    const invalidate = (code, message) => {
      for (const { entry, componentId } of members) {
        const result = output.get(entry.id);
        result.state = 'invalid'; result.amountUsd = null;
        result.issues.push({ code, severity: 'error', message, componentId });
        result.components[componentId] = { ...result.components[componentId], state: 'invalid', amountUsd: undefined, issues: [{ code, severity: 'error', message }] };
      }
    };
    if (policy === 'unique') {
      if (members.filter(member => decimal(member.component.billingQuantity).gt('0')).length > 1) invalidate('DUPLICATE_REGIONAL_FEE', '同じPlan・Regionの地域料金が重複しています。代表1行に地域利用時間をまとめ、他行の地域料金を無効にしてください。');
      continue;
    }
    let remaining = decimal('0');
    if (policy === 'allowance') {
      try {
        remaining = decimal(assumptions[members[0].group.remainingFrom] ?? '0');
        if (remaining.isNegative() || !remaining.isInteger() || remaining.gt(members[0].group.maximumAllowance)) throw Error('Invalid allowance');
      } catch {
        invalidate('INVALID_ALLOWANCE', '残り無料枠は定義された範囲内の整数で指定してください。');
        continue;
      }
      const total = sum(members.map(member => member.component.billingQuantity));
      if (remaining.gt('0') && total.gt(remaining) && new Set(members.map(member => member.component.unitPriceUsd)).size > 1) {
        invalidate('AMBIGUOUS_ALLOWANCE_ALLOCATION', 'Region間で単価が異なるため無料枠の配分を確定できません。無料枠0で控除前の見積もりを行ってください。');
        continue;
      }
    }
    let offset = decimal('0');
    for (const { entry, componentId, component } of members) {
      const target = output.get(entry.id).components[componentId];
      if (policy === 'allowance') {
        const quantity = decimal(component.billingQuantity), free = remaining.lt(quantity) ? remaining : quantity;
        target.grossAmountUsd = component.amountUsd;
        target.grossBillingQuantity = component.billingQuantity;
        target.allowanceApplied = free.toString();
        target.billingQuantity = quantity.minus(free).toString();
        target.amountUsd = quantity.minus(free).times(component.unitPriceUsd).toString();
        remaining = remaining.minus(free);
      }
      if (policy === 'tiered') {
        // Group identity is explicit; different SKUs/ranges must never be
        // silently combined as one meter.
        const reference = members[0].component.resolution;
        if (component.resolution.product.sku !== reference.product.sku || JSON.stringify(component.resolution.dimensions) !== JSON.stringify(reference.dimensions)) {
          const result = output.get(entry.id);
          result.state = 'invalid'; result.amountUsd = null;
          result.issues.push({ code: 'BILLING_GROUP_MISMATCH', severity: 'error', message: '合算対象の料金メーターが一致しません。', componentId });
          continue;
        }
        target.standaloneAmountUsd = component.amountUsd;
        target.tierUsageOffset = offset.toString();
        target.amountUsd = tierAmount(component.billingQuantity, component.resolution.dimensions, offset).toString();
        offset = offset.plus(component.billingQuantity);
      }
    }
  }
  for (const result of output.values()) {
    if (result?.amountUsd != null) {
      const components = Object.values(result.components ?? {}).filter(component => component.amountUsd !== undefined);
      result.amountUsd = sum(components.map(component => component.amountUsd)).toString();
      if (components.some(component => component.grossAmountUsd !== undefined)) result.grossAmountUsd = sum(components.map(component => component.grossAmountUsd ?? component.amountUsd)).toString();
    }
  }
  return output;
}
