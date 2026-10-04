export const RDS_INSTANCE_COLUMNS = [
  ['instanceType', 'DBインスタンスタイプ', 'text'],
  ['typeFamily', 'インスタンスタイプファミリー', 'text'],
  ['category', 'インスタンスカテゴリ', 'text'],
  ['vcpu', 'vCPU', 'number'],
  ['memory', 'メモリ (GiB)', 'number'],
  ['network', 'ネットワークパフォーマンス', 'text'],
  ['ebsThroughput', 'EBSスループット', 'text'],
  ['currentGeneration', 'CurrentGeneration', 'text'],
  ['hourly', 'オンデマンドの 1 時間あたりのコスト', 'number']
];

const numberFrom = value => {
  const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const hourlyFrom = product => {
  const dimensions = product.terms?.onDemand?.flatMap(term => term.priceDimensions ?? []) ?? [];
  const values = dimensions
    .filter(item => item.unit === 'Hrs' && item.pricePerUnit?.USD !== undefined)
    .map(item => Number(item.pricePerUnit.USD))
    .filter(Number.isFinite);
  return values.length === 1 ? values[0] : null;
};

export function rdsInstanceRows(products, { deployment = 'Single-AZ', databaseEngine = 'PostgreSQL' } = {}) {
  const grouped = new Map();
  for (const product of products) {
    const a = product.attributes ?? {};
    if (product.productFamily !== 'Database Instance') continue;
    if (a.databaseEngine !== databaseEngine) continue;
    if (a.deploymentOption !== deployment) continue;
    if (a.licenseModel && a.licenseModel !== 'No license required') continue;
    if (!a.instanceType?.startsWith('db.')) continue;

    const row = {
      instanceType: a.instanceType,
      typeFamily: a.instanceTypeFamily ?? a.instanceType.split('.')[1]?.toUpperCase() ?? '',
      category: a.instanceFamily ?? '',
      vcpu: numberFrom(a.vcpu),
      memory: numberFrom(a.memory),
      memoryLabel: a.memory ?? '',
      network: a.networkPerformance ?? '',
      ebsThroughput: a.dedicatedEbsThroughput ?? '',
      currentGeneration: a.currentGeneration ?? '',
      hourly: hourlyFrom(product)
    };
    const list = grouped.get(row.instanceType) ?? [];
    list.push(row);
    grouped.set(row.instanceType, list);
  }

  return [...grouped.entries()].map(([instanceType, rows]) => {
    const priced = rows.filter(row => row.hourly !== null);
    const uniquePrices = [...new Set(priced.map(row => row.hourly))];
    const representative = rows[0];
    return { ...representative, instanceType, hourly: uniquePrices.length === 1 ? uniquePrices[0] : null };
  }).sort((a, b) => a.instanceType.localeCompare(b.instanceType, 'en', { numeric: true }));
}

export function matchesRdsColumn(value, query, kind = 'text') {
  const q = String(query ?? '').trim();
  if (!q) return true;
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

export function filterRdsRows(rows, filters) {
  return rows.filter(row => RDS_INSTANCE_COLUMNS.every(([key, , kind]) => matchesRdsColumn(row[key], filters[key], kind)));
}
