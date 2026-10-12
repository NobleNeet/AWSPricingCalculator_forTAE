import { matchesRdsColumn } from './rds-instance-model.js';

export const REDSHIFT_INSTANCE_COLUMNS = [
  ['instanceType', 'インスタンスタイプ', 'text'],
  ['family', 'インスタンスファミリー', 'text'],
  ['vcpu', 'vCPU', 'number'],
  ['memory', 'メモリ (GiB)', 'number'],
  ['storage', 'ストレージ', 'text'],
  ['io', 'I/O', 'text'],
  ['currentGeneration', 'CurrentGeneration', 'text'],
  ['hourly', 'オンデマンドの 1 時間あたりのコスト', 'number']
];
const numberFrom = value => {
  const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
export function redshiftInstanceRows(products, allowedTypes = []) {
  const grouped = new Map();
  const allowed = new Set(allowedTypes);
  for (const product of products) {
    const a = product.attributes ?? {};
    if (product.productFamily !== 'Compute Instance' || a.operation !== 'RunComputeNode:0001') continue;
    if (!a.instanceType || !allowed.has(a.instanceType)) continue;
    const dimensions = product.terms?.onDemand?.flatMap(term => term.priceDimensions ?? []) ?? [];
    const values = dimensions.filter(d => d.unit === 'Hrs' && d.pricePerUnit?.USD !== undefined)
      .map(d => Number(d.pricePerUnit.USD)).filter(Number.isFinite);
    const row = {
      instanceType: a.instanceType, family: a.usageFamily ?? a.instanceType.split('.')[0].toUpperCase(),
      vcpu: numberFrom(a.vcpu), memory: numberFrom(a.memory), memoryLabel: a.memory ?? '',
      storage: a.storage ?? '', io: a.io ?? '', currentGeneration: a.currentGeneration ?? '',
      hourly: values.length === 1 ? values[0] : null
    };
    const existing = grouped.get(a.instanceType);
    if (existing) {
      if (existing.hourly !== row.hourly) existing.hourly = null;
    } else grouped.set(a.instanceType, row);
  }
  return [...grouped.values()].sort((a, b) => a.instanceType.localeCompare(b.instanceType, 'en', { numeric: true }));
}
export function filterRedshiftRows(rows, filters) {
  return rows.filter(row => REDSHIFT_INSTANCE_COLUMNS.every(([key,,kind]) => matchesRdsColumn(row[key], filters[key], kind)));
}
