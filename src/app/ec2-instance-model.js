export const EC2_INSTANCE_COLUMNS = [
  ['instanceType', 'インスタンス名', 'text'], ['family', 'インスタンスファミリー', 'text'], ['category', 'インスタンスカテゴリ', 'text'], ['vcpu', 'vCPU', 'number'], ['physicalCores', '物理コア', 'number'], ['memory', 'メモリ', 'number'], ['network', 'ネットワークパフォーマンス', 'text'], ['storage', 'ストレージ', 'text'], ['hourly', 'オンデマンドの 1 時間あたりのコスト', 'number'], ['currentGeneration', 'CurrentGeneration', 'text']
];

const numberFrom = value => { const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : null; };
const hourlyFrom = product => {
  const dimensions = product.terms?.onDemand?.flatMap(term => term.priceDimensions ?? []) ?? [];
  const candidates = dimensions.filter(item => item.unit === 'Hrs' && Number(item.pricePerUnit?.USD) >= 0).map(item => Number(item.pricePerUnit.USD));
  return candidates.length === 1 ? candidates[0] : null;
};

export function instanceRows(products, operatingSystem, tenancy = 'Shared') {
  const rows = new Map();
  const ambiguous = new Set();
  for (const product of products) {
    const a = product.attributes ?? {}, type = a.instanceType;
    if (!type || a.operatingSystem !== operatingSystem) continue;
    if (a.tenancy && a.tenancy !== tenancy) continue;
    if (a.preInstalledSw && a.preInstalledSw !== 'NA') continue;
    if (a.capacitystatus && a.capacitystatus !== 'Used') continue;
    if (a.marketoption && a.marketoption !== 'OnDemand') continue;
    const hourly = hourlyFrom(product); if (hourly === null) continue;
    const row = {
      instanceType: type,
      family: type.split('.')[0],
      category: a.instanceFamily ?? a.instanceCategory ?? a.instanceTypeFamily ?? '',
      vcpu: numberFrom(a.vcpu),
      physicalCores: numberFrom(a.physicalCores ?? a.physicalCoreCount ?? a.coreCount),
      memory: numberFrom(a.memory), memoryLabel: a.memory ?? '',
      network: a.networkPerformance ?? '', storage: a.storage ?? '', hourly,
      currentGeneration: a.currentGeneration ?? ''
    };
    const previous = rows.get(type);
    if (!previous) rows.set(type, row);
    else if (previous.hourly !== row.hourly) ambiguous.add(type);
  }
  for (const type of ambiguous) rows.get(type).hourly = null;
  return [...rows.values()].sort((a, b) => a.instanceType.localeCompare(b.instanceType, 'en', { numeric: true }));
}

export function matchesColumn(value, query, kind = 'text') {
  const q = String(query ?? '').trim(); if (!q) return true;
  if (kind !== 'number') return String(value ?? '').toLowerCase().includes(q.toLowerCase());
  const target = typeof value === 'number' ? value : numberFrom(value);
  const match = q.match(/^\s*(<=|>=|=|<|>)?\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (target === null || !match) return false;
  const operand = Number(match[2]), operator = match[1] ?? '=';
  if (operator === '<') return target < operand;
  if (operator === '<=') return target <= operand;
  if (operator === '>') return target > operand;
  if (operator === '>=') return target >= operand;
  return target === operand;
}

export function filterRows(rows, filters) {
  return rows.filter(row => EC2_INSTANCE_COLUMNS.every(([key, , kind]) => matchesColumn(row[key], filters[key], kind)));
}
