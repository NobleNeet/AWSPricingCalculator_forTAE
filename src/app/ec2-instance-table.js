import { prices } from './app.js';
import { EC2_INSTANCE_COLUMNS as COLUMNS, instanceRows, filterRows } from './ec2-instance-model.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const drawer = document.getElementById('service-drawer');

function drawerBounds() {
  return { min: Math.min(510, window.innerWidth), max: Math.max(Math.min(window.innerWidth * 0.96, window.innerWidth), Math.min(510, window.innerWidth)) };
}

function setDrawerWidth(width) {
  const { min, max } = drawerBounds();
  const next = Math.round(Math.min(max, Math.max(min, width)));
  drawer.style.width = `${next}px`;
  const slider = drawer.querySelector('[data-ec2-drawer-width]');
  const value = drawer.querySelector('.ec2-drawer-width-value');
  if (slider) {
    slider.min = String(Math.round(min));
    slider.max = String(Math.round(max));
    slider.value = String(next);
  }
  if (value) value.textContent = `${next}px`;
}

function ensureResizableDrawer() {
  drawer.classList.add('ec2-wide');
  const { max } = drawerBounds();
  if (!drawer.style.width) setDrawerWidth(Math.min(1200, max));

  if (!drawer.querySelector('.ec2-drawer-resizer')) {
    const resizer = document.createElement('div');
    resizer.className = 'ec2-drawer-resizer';
    resizer.setAttribute('role', 'separator');
    resizer.setAttribute('aria-orientation', 'vertical');
    resizer.setAttribute('aria-label', 'EC2編集パネルの幅を変更');
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
    controls.innerHTML = '<label>パネル幅 <input type="range" data-ec2-drawer-width aria-label="EC2編集パネルの幅"><span class="ec2-drawer-width-value"></span></label><button type="button" data-ec2-drawer-default>標準</button><button type="button" data-ec2-drawer-max>最大</button>';
    const heading = drawer.querySelector('.dialog-heading');
    heading?.after(controls);
    const slider = controls.querySelector('[data-ec2-drawer-width]');
    slider.addEventListener('input', () => setDrawerWidth(Number(slider.value)));
    controls.querySelector('[data-ec2-drawer-default]').addEventListener('click', () => setDrawerWidth(510));
    controls.querySelector('[data-ec2-drawer-max]').addEventListener('click', () => setDrawerWidth(drawerBounds().max));
    setDrawerWidth(parseFloat(drawer.style.width) || Math.min(1200, drawerBounds().max));
  }
}

function resetDrawerWidth() {
  drawer.classList.remove('ec2-wide');
  drawer.style.width = '';
  drawer.querySelector('.ec2-drawer-resizer')?.remove();
  drawer.querySelector('.ec2-drawer-width-controls')?.remove();
}

function tableHtml(rows, selected, filters, sortKey, sortDirection) {
  const filtered = filterRows(rows, filters);
  filtered.sort((a, b) => {
    const left = a[sortKey], right = b[sortKey];
    const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left ?? '').localeCompare(String(right ?? ''), 'ja', { numeric: true });
    return sortDirection === 'desc' ? -result : result;
  });
  return `<div class="ec2-instance-summary">${filtered.length} / ${rows.length} 件</div><div class="ec2-instance-scroll"><table class="ec2-instance-table"><thead><tr>${COLUMNS.map(([key, label]) => `<th><button type="button" class="ec2-sort" data-ec2-sort="${key}">${esc(label)}${sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr><tr class="ec2-filter-row">${COLUMNS.map(([key, label, kind]) => `<th><input data-ec2-filter="${key}" value="${esc(filters[key] ?? '')}" placeholder="${kind === 'number' ? '例: >=4' : '絞り込み'}" aria-label="${esc(label)}を絞り込み"></th>`).join('')}</tr></thead><tbody>${filtered.map(row => `<tr class="${row.instanceType === selected ? 'selected' : ''}"><td><button type="button" class="ec2-instance-select" data-ec2-instance="${esc(row.instanceType)}">${esc(row.instanceType)}</button></td><td>${esc(row.family)}</td><td>${esc(row.category || '—')}</td><td>${esc(row.vcpu ?? '—')}</td><td>${esc(row.physicalCores ?? '—')}</td><td>${esc(row.memoryLabel || '—')}</td><td>${esc(row.network || '—')}</td><td>${esc(row.storage || '—')}</td><td>${row.hourly === null ? '—' : `$${row.hourly.toFixed(6)}`}</td><td>${esc(row.currentGeneration || '—')}</td></tr>`).join('') || '<tr><td colspan="10">条件に一致するインスタンスはありません。</td></tr>'}</tbody></table></div>`;
}

async function enhance(select) {
  if (select.dataset.ec2Enhanced === 'true') return;
  select.dataset.ec2Enhanced = 'true';
  ensureResizableDrawer();
  const label = select.closest('label'); if (!label) return;
  const picker = document.createElement('div'); picker.className = 'ec2-instance-picker'; picker.innerHTML = '<p>EC2インスタンス一覧を読み込んでいます…</p>';
  label.after(picker); select.classList.add('ec2-original-select');
  try {
    const os = document.querySelector('[data-scope="profile"][data-field="os"]')?.value ?? 'Linux';
    const data = await prices.products('AmazonEC2', 'ap-northeast-1');
    if (!picker.isConnected) return;
    const rows = instanceRows(data.products, os), filters = Object.fromEntries(COLUMNS.map(([key]) => [key, '']));
    let sortKey = 'instanceType', sortDirection = 'asc';
    const render = () => {
      const activeKey = document.activeElement?.dataset?.ec2Filter, caret = activeKey ? document.activeElement.selectionStart : null;
      picker.innerHTML = tableHtml(rows, select.value, filters, sortKey, sortDirection);
      if (activeKey) { const input = picker.querySelector(`[data-ec2-filter="${activeKey}"]`); input?.focus(); if (caret !== null) input?.setSelectionRange(caret, caret); }
    };
    picker.addEventListener('input', event => { const key = event.target.dataset.ec2Filter; if (!key) return; filters[key] = event.target.value; render(); });
    picker.addEventListener('click', event => {
      const sort = event.target.closest('[data-ec2-sort]');
      if (sort) { const key = sort.dataset.ec2Sort; sortDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'; sortKey = key; render(); return; }
      const choice = event.target.closest('[data-ec2-instance]'); if (!choice) return;
      select.value = choice.dataset.ec2Instance; select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    render();
  } catch (error) { picker.innerHTML = `<p class="invalid">EC2インスタンス一覧を表示できません: ${esc(error.message)}</p>`; select.classList.remove('ec2-original-select'); }
}

function scan() {
  const select = document.querySelector('#input-component-instance-instanceType');
  if (select) enhance(select);
  else resetDrawerWidth();
}
new MutationObserver(scan).observe(document.getElementById('drawer-content'), { childList: true, subtree: true });
drawer.addEventListener('close', resetDrawerWidth);
window.addEventListener('resize', () => { if (drawer.classList.contains('ec2-wide') && window.innerWidth > 800) setDrawerWidth(parseFloat(drawer.style.width) || 1200); });
scan();
