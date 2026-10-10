import { prices } from './app.js';
import { EC2_INSTANCE_COLUMNS, instanceRows, filterRows } from './ec2-instance-model.js';
import { RDS_INSTANCE_COLUMNS, rdsInstanceRows, filterRdsRows } from './rds-instance-model.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const drawer = document.getElementById('service-drawer');
const drawerTitle = document.getElementById('drawer-title');

function drawerKind() {
  const title = drawerTitle?.textContent?.trim();
  if (title === 'Amazon EC2') return 'ec2';
  if (title === 'Amazon RDS for PostgreSQL') return 'rds';
  if (title === 'Amazon RDS for Oracle') return 'rds-oracle';
  return null;
}

function currentRegion() {
  const drawerRegion = document.getElementById('drawer-region')?.value;
  if (drawerRegion && drawerRegion !== 'inherit') return drawerRegion;
  return document.getElementById('project-region')?.value || 'ap-northeast-1';
}

function drawerBounds() {
  return { min: Math.min(510, window.innerWidth), max: Math.max(Math.min(window.innerWidth * 0.96, window.innerWidth), Math.min(510, window.innerWidth)) };
}

function setDrawerWidth(width) {
  const { min, max } = drawerBounds();
  const next = Math.round(Math.min(max, Math.max(min, width)));
  drawer.style.width = `${next}px`;
  const slider = drawer.querySelector('[data-instance-drawer-width]');
  const value = drawer.querySelector('.ec2-drawer-width-value');
  if (slider) {
    slider.min = String(Math.round(min));
    slider.max = String(Math.round(max));
    slider.value = String(next);
  }
  if (value) value.textContent = `${next}px`;
}

function ensureResizableDrawer(kind) {
  drawer.classList.add('ec2-wide');
  const { max } = drawerBounds();
  if (!drawer.style.width) setDrawerWidth(Math.min(1200, max));

  if (!drawer.querySelector('.ec2-drawer-resizer')) {
    const resizer = document.createElement('div');
    resizer.className = 'ec2-drawer-resizer';
    resizer.setAttribute('role', 'separator');
    resizer.setAttribute('aria-orientation', 'vertical');
    resizer.setAttribute('aria-label', '編集パネルの幅を変更');
    resizer.title = '左右にドラッグしてパネル幅を変更';
    drawer.append(resizer);
    resizer.addEventListener('pointerdown', event => {
      if (window.innerWidth <= 800) return;
      event.preventDefault();
      resizer.classList.add('dragging');
      resizer.setPointerCapture(event.pointerId);
      const move = moveEvent => setDrawerWidth(window.innerWidth - moveEvent.clientX);
      const end = endEvent => {
        resizer.classList.remove('dragging');
        if (resizer.hasPointerCapture(endEvent.pointerId)) resizer.releasePointerCapture(endEvent.pointerId);
        resizer.removeEventListener('pointermove', move);
        resizer.removeEventListener('pointerup', end);
        resizer.removeEventListener('pointercancel', end);
      };
      resizer.addEventListener('pointermove', move);
      resizer.addEventListener('pointerup', end);
      resizer.addEventListener('pointercancel', end);
    });
  }

  if (!drawer.querySelector('.ec2-drawer-width-controls')) {
    const controls = document.createElement('div');
    controls.className = 'ec2-drawer-width-controls';
    controls.innerHTML = `<label>パネル幅 <input type="range" data-instance-drawer-width aria-label="${kind.startsWith('rds') ? 'RDS' : 'EC2'}編集パネルの幅"><span class="ec2-drawer-width-value"></span></label><button type="button" data-instance-drawer-default>標準</button><button type="button" data-instance-drawer-max>最大</button>`;
    const heading = drawer.querySelector('.dialog-heading');
    heading?.after(controls);
    const slider = controls.querySelector('[data-instance-drawer-width]');
    slider.addEventListener('input', () => setDrawerWidth(Number(slider.value)));
    controls.querySelector('[data-instance-drawer-default]').addEventListener('click', () => setDrawerWidth(510));
    controls.querySelector('[data-instance-drawer-max]').addEventListener('click', () => setDrawerWidth(drawerBounds().max));
    setDrawerWidth(parseFloat(drawer.style.width) || Math.min(1200, drawerBounds().max));
  }
}

function resetDrawerWidth() {
  drawer.classList.remove('ec2-wide');
  drawer.style.width = '';
  drawer.querySelector('.ec2-drawer-resizer')?.remove();
  drawer.querySelector('.ec2-drawer-width-controls')?.remove();
}

function displayCell(row, key) {
  if (key === 'hourly') return row.hourly === null ? '—' : `$${row.hourly.toFixed(6)}`;
  if (key === 'memory') return esc(row.memoryLabel || (row.memory ?? '—'));
  return esc(row[key] ?? '—');
}

function tableHtml({ rows, selected, filters, sortKey, sortDirection, columns, filterRowsFn, prefix }) {
  const filtered = filterRowsFn(rows, filters);
  filtered.sort((a, b) => {
    const left = a[sortKey], right = b[sortKey];
    const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left ?? '').localeCompare(String(right ?? ''), 'ja', { numeric: true });
    return sortDirection === 'desc' ? -result : result;
  });
  return `<div class="ec2-instance-summary">${filtered.length} / ${rows.length} 件</div><div class="ec2-instance-scroll"><table class="ec2-instance-table"><thead><tr>${columns.map(([key, label]) => `<th><button type="button" class="ec2-sort" data-instance-sort="${key}">${esc(label)}${sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr><tr class="ec2-filter-row">${columns.map(([key, label, kind]) => `<th><input data-instance-filter="${key}" value="${esc(filters[key] ?? '')}" placeholder="${kind === 'number' ? '例: >=4' : '絞り込み'}" aria-label="${esc(label)}を絞り込み"></th>`).join('')}</tr></thead><tbody>${filtered.map(row => `<tr class="${row.instanceType === selected ? 'selected' : ''}">${columns.map(([key], index) => `<td>${index === 0 ? `<button type="button" class="ec2-instance-select" data-instance-choice="${esc(row.instanceType)}">${esc(row.instanceType)}</button>` : displayCell(row, key)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}">条件に一致する${prefix}インスタンスはありません。</td></tr>`}</tbody></table></div>`;
}

function tableConfig(kind) {
  if (kind === 'rds' || kind === 'rds-oracle') {
    return {
      columns: RDS_INSTANCE_COLUMNS,
      filterRowsFn: filterRdsRows,
      serviceCode: 'AmazonRDS',
      loadingLabel: 'RDS DBインスタンス一覧',
      prefix: 'DB',
      makeRows: data => rdsInstanceRows(data.products, {
        deployment: document.querySelector('[data-scope="profile"][data-field="deployment"]')?.value ?? 'Single-AZ',
        databaseEngine: kind === 'rds-oracle' ? 'Oracle' : 'PostgreSQL',
        licenseModel: kind === 'rds-oracle' ? document.querySelector('[data-scope="profile"][data-field="licenseModel"]')?.value : 'No license required',
        databaseEdition: kind === 'rds-oracle' ? document.querySelector('[data-scope="profile"][data-field="databaseEdition"]')?.value : undefined
      })
    };
  }
  return {
    columns: EC2_INSTANCE_COLUMNS,
    filterRowsFn: filterRows,
    serviceCode: 'AmazonEC2',
    loadingLabel: 'EC2インスタンス一覧',
    prefix: 'EC2',
    makeRows: data => instanceRows(
      data.products,
      document.querySelector('[data-scope="profile"][data-field="os"]')?.value ?? 'Linux',
      document.querySelector('[data-scope="profile"][data-field="tenancy"]')?.value ?? 'Shared',
      document.querySelector('[data-scope="profile"][data-field="software"]')?.value ?? 'NA'
    )
  };
}

function alignEc2CalculatorFieldOrder(instanceTypeLabel, kind) {
  if (kind !== 'ec2') return;
  const quantityLabel = document.querySelector('#input-component-instance-quantity')?.closest('label');
  if (quantityLabel && quantityLabel !== instanceTypeLabel) instanceTypeLabel.before(quantityLabel);
}

async function enhance(select, kind) {
  const marker = `${kind.replaceAll('-', '')}Enhanced`;
  // dataset keys cannot contain a hyphen followed by a lowercase character.
  if (select.dataset[marker] === 'true') return;
  select.dataset[marker] = 'true';
  ensureResizableDrawer(kind);
  const label = select.closest('label'); if (!label) return;
  alignEc2CalculatorFieldOrder(label, kind);
  const config = tableConfig(kind);
  const picker = document.createElement('div');
  picker.className = 'ec2-instance-picker';
  picker.dataset.instancePicker = kind;
  picker.innerHTML = `<p>${config.loadingLabel}を読み込んでいます…</p>`;
  label.after(picker);
  select.classList.add('ec2-original-select');
  try {
    const region = currentRegion();
    const data = await prices.products(config.serviceCode, region);
    if (!picker.isConnected || drawerKind() !== kind) return;
    const rows = config.makeRows(data);
    const filters = Object.fromEntries(config.columns.map(([key]) => [key, '']));
    let sortKey = 'instanceType', sortDirection = 'asc';
    const render = () => {
      const activeKey = document.activeElement?.dataset?.instanceFilter, caret = activeKey ? document.activeElement.selectionStart : null;
      picker.innerHTML = tableHtml({ rows, selected: select.value, filters, sortKey, sortDirection, columns: config.columns, filterRowsFn: config.filterRowsFn, prefix: config.prefix });
      if (activeKey) { const input = picker.querySelector(`[data-instance-filter="${activeKey}"]`); input?.focus(); if (caret !== null) input?.setSelectionRange(caret, caret); }
    };
    picker.addEventListener('input', event => { const key = event.target.dataset.instanceFilter; if (!key) return; filters[key] = event.target.value; render(); });
    picker.addEventListener('click', event => {
      const sort = event.target.closest('[data-instance-sort]');
      if (sort) { const key = sort.dataset.instanceSort; sortDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'; sortKey = key; render(); return; }
      const choice = event.target.closest('[data-instance-choice]'); if (!choice) return;
      select.value = choice.dataset.instanceChoice;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    render();
  } catch (error) {
    picker.innerHTML = `<p class="invalid">${config.loadingLabel}を表示できません: ${esc(error.message)}</p>`;
    select.classList.remove('ec2-original-select');
  }
}

function scan() {
  const kind = drawerKind();
  if (!kind) {
    resetDrawerWidth();
    return;
  }
  const select = document.querySelector('#input-component-instance-instanceType');
  if (select) enhance(select, kind);
  else resetDrawerWidth();
}
new MutationObserver(scan).observe(document.getElementById('drawer-content'), { childList: true, subtree: true });
drawer.addEventListener('close', resetDrawerWidth);
window.addEventListener('resize', () => { if (drawer.classList.contains('ec2-wide') && window.innerWidth > 800) setDrawerWidth(parseFloat(drawer.style.width) || 1200); });
scan();
