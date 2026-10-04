import { prices } from './app.js';

const COLUMNS = [
  ['instanceType', 'インスタンス名', 'text'],
  ['family', 'インスタンスファミリー', 'text'],
  ['category', 'インスタンスカテゴリ', 'text'],
  ['vcpu', 'vCPU', 'number'],
  ['physicalCores', '物理コア', 'number'],
  ['memory', 'メモリ', 'number'],
  ['network', 'ネットワークパフォーマンス', 'text'],
  ['storage', 'ストレージ', 'text'],
  ['hourly', 'オンデマンドの 1 時間あたりのコスト', 'number'],
  ['currentGeneration', 'CurrentGeneration', 'text']
];

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = value => { const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : null; };
const familyOf = type => String(type ?? '').split('.')[0];
const categoryOf = attributes => attributes.instanceFamily ?? attributes.instanceCategory ?? attributes.instanceTypeFamily ?? '';
const physicalCoresOf = attributes => attributes.physicalCores ?? attributes.physicalCoreCount ?? attributes.coreCount ?? '';
const hourlyOf = product => {
  const dimensions = product.terms?.onDemand?.flatMap(term => term.priceDimensions ?? []) ?? [];
  const dimension = dimensions.find(item => item.unit === 'Hrs' && Number(item.pricePerUnit?.USD) >= 0);
  return dimension ? Number(dimension.pricePerUnit.USD) : null;
};

export function instanceRows(products, operatingSystem) {
  const rows = new Map();
  for (const product of products) {
    const a = product.attributes ?? {};
    const type = a.instanceType;
    if (!type || a.operatingSystem !== operatingSystem) continue;
    if (a.tenancy && a.tenancy !== 'Shared') continue;
    if (a.preInstalledSw && a.preInstalledSw !== 'NA') continue;
    if (a.capacitystatus && a.capacitystatus !== 'Used') continue;
    if (a.marketoption && a.marketoption !== 'OnDemand') continue;
    if (a.operation && a.operation !== 'RunInstances') continue;
    const hourly = hourlyOf(product);
    if (hourly === null) continue;
    const row = {
      instanceType: type,
      family: familyOf(type),
      category: categoryOf(a),
      vcpu: num(a.vcpu),
      physicalCores: num(physicalCoresOf(a)),
      memory: num(a.memory),
      memoryLabel: a.memory ?? '',
      network: a.networkPerformance ?? '',
      storage: a.storage ?? '',
      hourly,
      currentGeneration: a.currentGeneration ?? ''
    };
    const previous = rows.get(type);
    if (!previous || row.hourly < previous.hourly) rows.set(type, row);
  }
  return [...rows.values()].sort((a, b) => a.instanceType.localeCompare(b.instanceType, 'en', { numeric: true }));
}

export function matchesColumn(value, query, kind = 'text') {
  const q = String(query ?? '').trim();
  if (!q) return true;
  if (kind !== 'number') return String(value ?? '').toLowerCase().includes(q.toLowerCase());
  const target = typeof value === 'number' ? value : num(value);
  const match = q.match(/^\s*(<=|>=|=|<|>)?\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (target === null || !match) return false;
  const operand = Number(match[2]);
  return ({ '<': target < operand, '<=': target <= operand, '>': target > operand, '>=': target >= operand, '=': target === operand, undefined: target === operand })[match[1]];
}

export function filterRows(rows, filters) {
  return rows.filter(row => COLUMNS.every(([key, , kind]) => matchesColumn(row[key], filters[key], kind)));
}

function tableHtml(rows, selected, filters, sortKey, sortDirection) {
  const filtered = filterRows(rows, filters);
  filtered.sort((a, b) => {
    const left = a[sortKey], right = b[sortKey];
    const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left ?? '').localeCompare(String(right ?? ''), 'ja', { numeric: true });
    return sortDirection === 'desc' ? -result : result;
  });
  return `<div class="ec2-instance-summary">${filtered.length} / ${rows.length} 件</div><div class="ec2-instance-scroll"><table class="ec2-instance-table"><thead><tr>${COLUMNS.map(([key, label]) => `<th><button type="button" class="ec2-sort" data-ec2-sort="${key}">${esc(label)}${sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr><tr class="ec2-filter-row">${COLUMNS.map(([key, label, kind]) => `<th><input data-ec2-filter="${key}" value="${esc(filters[key] ?? '')}" placeholder="${kind === 'number' ? '例: >=4' : '絞り込み'}" aria-label="${esc(label)}を絞り込み"></th>`).join('')}</tr></thead><tbody>${filtered.map(row => `<tr class="${row.instanceType === selected ? 'selected' : ''}" data-ec2-instance="${esc(row.instanceType)}"><td><button type="button" class="ec2-instance-select" data-ec2-instance="${esc(row.instanceType)}">${esc(row.instanceType)}</button></td><td>${esc(row.family)}</td><td>${esc(row.category || '—')}</td><td>${esc(row.vcpu ?? '—')}</td><td>${esc(row.physicalCores ?? '—')}</td><td>${esc(row.memoryLabel || '—')}</td><td>${esc(row.network || '—')}</td><td>${esc(row.storage || '—')}</td><td>${row.hourly === null ? '—' : `$${row.hourly.toFixed(6)}`}</td><td>${esc(row.currentGeneration || '—')}</td></tr>`).join('') || '<tr><td colspan="10">条件に一致するインスタンスはありません。</td></tr>'}</tbody></table></div>`;
}

async function enhance(select) {
  if (select.dataset.ec2Enhanced === 'true') return;
  select.dataset.ec2Enhanced = 'true';
  const label = select.closest('label');
  if (!label) return;
  const picker = document.createElement('div');
  picker.className = 'ec2-instance-picker';
  picker.innerHTML = '<p>EC2インスタンス一覧を読み込んでいます…</p>';
  label.after(picker);
  select.classList.add('ec2-original-select');
  try {
    const os = document.querySelector('[data-scope="profile"][data-field="os"]')?.value ?? 'Linux';
    const data = await prices.products('AmazonEC2', 'ap-northeast-1');
    if (!picker.isConnected) return;
    const rows = instanceRows(data.products, os);
    const filters = Object.fromEntries(COLUMNS.map(([key]) => [key, '']));
    let sortKey = 'instanceType', sortDirection = 'asc';
    const render = () => {
      const activeKey = document.activeElement?.dataset?.ec2Filter;
      const caret = activeKey ? document.activeElement.selectionStart : null;
      picker.innerHTML = tableHtml(rows, select.value, filters, sortKey, sortDirection);
      if (activeKey) {
        const input = picker.querySelector(`[data-ec2-filter="${activeKey}"]`);
        input?.focus(); if (caret !== null) input?.setSelectionRange(caret, caret);
      }
    };
    picker.addEventListener('input', event => { const key = event.target.dataset.ec2Filter; if (!key) return; filters[key] = event.target.value; render(); });
    picker.addEventListener('click', event => {
      const sort = event.target.closest('[data-ec2-sort]');
      if (sort) { const key = sort.dataset.ec2Sort; sortDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'; sortKey = key; render(); return; }
      const choice = event.target.closest('[data-ec2-instance]');
      if (!choice) return;
      select.value = choice.dataset.ec2Instance;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    render();
  } catch (error) { picker.innerHTML = `<p class="invalid">EC2インスタンス一覧を表示できません: ${esc(error.message)}</p>`; select.classList.remove('ec2-original-select'); }
}

function scan() {
  const select = document.querySelector('#input-component-instance-instanceType');
  if (select) enhance(select);
}

new MutationObserver(scan).observe(document.getElementById('drawer-content'), { childList: true, subtree: true });
scan();
