const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

const serviceDefs = {
  ec2: {
    label: 'EC2', icon: 'EC2', desc: 'Compute',
    variants: {
      'm7i.large': { vcpu: 2, memory: 8, monthly: 28400 },
      'm7i.xlarge': { vcpu: 4, memory: 16, monthly: 42700 },
      'm7i.2xlarge': { vcpu: 8, memory: 32, monthly: 81200 },
      'r7i.xlarge': { vcpu: 4, memory: 32, monthly: 61300 }
    },
    defaultConfig: () => ({ variant: 'm7i.large', quantity: 1 })
  },
  lambda: {
    label: 'Lambda', icon: 'λ', desc: 'Serverless compute',
    defaultConfig: () => ({ requestsM: 5, monthly: 12300 })
  },
  rds: {
    label: 'RDS', icon: 'RDS', desc: 'Managed database',
    variants: {
      'db.t4g.medium': { vcpu: 2, memory: 4, monthly: 18200 },
      'db.m7g.large': { vcpu: 2, memory: 8, monthly: 30400 },
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 48500 }
    },
    defaultConfig: () => ({ variant: 'db.t4g.medium', quantity: 1 })
  },
  aurora: {
    label: 'Aurora', icon: 'AUR', desc: 'Aurora provisioned',
    variants: {
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 42000 },
      'db.r7g.xlarge': { vcpu: 4, memory: 32, monthly: 76000 }
    },
    defaultConfig: () => ({ variant: 'db.r7g.large', quantity: 1 })
  },
  auroraServerless: {
    label: 'Aurora Serverless', icon: 'AUR', desc: 'Aurora Serverless v2',
    defaultConfig: () => ({ acu: 2, monthly: 28000 })
  },
  s3: {
    label: 'S3', icon: 'S3', desc: 'Object storage',
    defaultConfig: () => ({ gb: 500, rate: 7.6 })
  },
  ebs: {
    label: 'EBS', icon: 'EBS', desc: 'Block storage',
    defaultConfig: () => ({ gb: 200, rate: 12 })
  },
  alb: {
    label: 'ALB', icon: 'ALB', desc: 'Load balancer',
    defaultConfig: () => ({ monthly: 6500 })
  },
  apiGateway: {
    label: 'API Gateway', icon: 'API', desc: 'Managed API endpoint',
    defaultConfig: () => ({ requestsM: 5, monthly: 4300 })
  },
  cloudfront: {
    label: 'CloudFront', icon: 'CF', desc: 'CDN',
    defaultConfig: () => ({ gb: 300, monthly: 5200 })
  },
  nat: {
    label: 'NAT Gateway', icon: 'NAT', desc: 'Network egress',
    defaultConfig: () => ({ monthly: 7800 })
  }
};

let rows = [
  {
    id: 'compute', label: 'EC2 / Lambda', kind: 'linked',
    allowed: ['ec2', 'lambda'],
    cells: {
      A: { service: 'ec2', config: { variant: 'm7i.large', quantity: 2 } },
      B: { service: 'ec2', config: { variant: 'm7i.xlarge', quantity: 2 } },
      C: { service: 'lambda', config: { requestsM: 5, monthly: 12300 } }
    }
  },
  {
    id: 'database', label: 'RDS / Aurora', kind: 'linked',
    allowed: ['rds', 'aurora', 'auroraServerless'],
    cells: {
      A: { service: 'rds', config: { variant: 'db.t4g.medium', quantity: 1 } },
      B: { service: 'aurora', config: { variant: 'db.r7g.large', quantity: 1 } },
      C: { service: 'auroraServerless', config: { acu: 2, monthly: 28000 } }
    }
  },
  {
    id: 's3', label: 'S3', kind: 'linked',
    allowed: ['s3'],
    cells: {
      A: { service: 's3', config: { gb: 500, rate: 7.6 } },
      B: { service: 's3', config: { gb: 500, rate: 7.6 } },
      C: { service: 's3', config: { gb: 1000, rate: 7.1 } }
    }
  },
  {
    id: 'alb', label: 'ALB', kind: 'unique',
    allowed: ['alb'],
    cells: {
      A: { service: 'alb', config: { monthly: 6500 } },
      B: { service: 'alb', config: { monthly: 6500 } },
      C: null
    }
  },
  {
    id: 'api-gateway', label: 'API Gateway', kind: 'unique',
    allowed: ['apiGateway'],
    cells: {
      A: null,
      B: null,
      C: { service: 'apiGateway', config: { requestsM: 5, monthly: 4300 } }
    }
  },
  {
    id: 'ebs', label: 'EBS', kind: 'unique',
    allowed: ['ebs'],
    cells: {
      A: { service: 'ebs', config: { gb: 200, rate: 12 } },
      B: { service: 'ebs', config: { gb: 300, rate: 12 } },
      C: null
    }
  }
];

let plans = [
  { id: 'A', name: '案A', note: 'ベンダー原案' },
  { id: 'B', name: '案B', note: 'RDS→Aurora' },
  { id: 'C', name: '案C', note: 'サーバーレス寄り' }
];

let baselineId = 'A';
let editing = null;
let addingToPlanId = null;

function priceForCell(cell) {
  if (!cell) return 0;
  const def = serviceDefs[cell.service];
  const c = cell.config;
  if (def.variants) {
    const spec = def.variants[c.variant];
    return (spec ? spec.monthly : 0) * (c.quantity || 1);
  }
  if (cell.service === 's3' || cell.service === 'ebs') return (c.gb || 0) * (c.rate || 0);
  return Number(c.monthly || 0);
}

function totalForPlan(planId) {
  return rows.reduce((sum, row) => sum + priceForCell(row.cells[planId]), 0);
}

function deltaText(value, base) {
  const d = value - base;
  if (d === 0) return { text: '基準', cls: '' };
  return { text: `${d > 0 ? '+' : '−'}${yen.format(Math.abs(d))}`, cls: d > 0 ? 'up' : 'down' };
}

function cell(cls, html) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  return el;
}

function rowLabelHtml(row) {
  const services = [...new Set(plans.map(p => row.cells[p.id]?.service).filter(Boolean))];
  const icons = services.map(key => `<span class="mini-service">${serviceDefs[key].icon}</span>`).join('');
  const suffix = row.kind === 'linked' ? '置換・比較' : '案ごとに有無あり';
  return `
    <div class="row-title-wrap">
      <div class="row-icons">${icons || '<span class="mini-service muted-box">—</span>'}</div>
      <div>
        <div class="service-name">${row.label}</div>
        <div class="service-desc">${suffix}</div>
      </div>
    </div>`;
}

function summaryLines(cell) {
  if (!cell) return '<div class="summary-line muted">この案では使用しません</div>';
  const def = serviceDefs[cell.service];
  const c = cell.config;
  if (def.variants) {
    const spec = def.variants[c.variant];
    return `<div class="summary-line">${c.variant} × ${c.quantity || 1}</div><div class="summary-line">${spec.vcpu} vCPU · ${spec.memory} GiB / instance</div>`;
  }
  if (cell.service === 's3' || cell.service === 'ebs') {
    return `<div class="summary-line">${Number(c.gb || 0).toLocaleString()} GB</div><div class="summary-line">${yen.format(c.rate || 0)} / GB-month</div>`;
  }
  if (cell.service === 'lambda' || cell.service === 'apiGateway') {
    return `<div class="summary-line">${c.requestsM || 0}M requests / month</div>`;
  }
  if (cell.service === 'auroraServerless') {
    return `<div class="summary-line">${c.acu || 0} ACU average</div>`;
  }
  if (cell.service === 'cloudfront') {
    return `<div class="summary-line">${c.gb || 0} GB / month</div>`;
  }
  return `<div class="summary-line">月額固定のUIモック値</div>`;
}

function render() {
  const grid = document.getElementById('comparisonGrid');
  grid.style.setProperty('--plan-count', plans.length);
  grid.innerHTML = '';

  const baseTotal = totalForPlan(baselineId);

  grid.appendChild(cell('grid-cell row-label header-cell', `
    <div class="eyebrow dark">COMPARISON</div>
    <div style="margin-top:10px;font-weight:750">構成そのものも比較</div>
    <div class="service-desc">同じ行＝比較したい項目。役割名の入力は不要。</div>
  `));

  plans.forEach(plan => {
    const total = totalForPlan(plan.id);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell header-cell plan', `
      <div class="plan-head">
        <div><div class="plan-name">${plan.name}</div><div class="plan-note">${plan.note}</div></div>
        <button class="btn small" data-duplicate="${plan.id}">複製</button>
      </div>
      <div class="plan-total">${yen.format(total)}<span class="muted" style="font-size:12px"> /月</span></div>
      <div class="delta ${d.cls}">${d.text}</div>
      <button class="add-service-inline" data-add-service="${plan.id}">＋ この案にサービス追加</button>
    `));
  });

  rows.forEach(row => {
    grid.appendChild(cell(`grid-cell row-label ${row.kind === 'unique' ? 'unique-row' : ''}`, rowLabelHtml(row)));

    plans.forEach(plan => {
      const c = row.cells[plan.id] || null;
      if (!c) {
        grid.appendChild(cell('grid-cell service-cell empty-cell', `
          <div class="empty-mark">—</div>
          <div class="service-summary">${summaryLines(null)}</div>
          <div class="cell-actions"><button class="btn small subtle" data-fill-row="${row.id}" data-fill-plan="${plan.id}">この行に追加</button></div>
        `));
        return;
      }
      const def = serviceDefs[c.service];
      const p = priceForCell(c);
      const canReplace = row.allowed.length > 1;
      grid.appendChild(cell('grid-cell service-cell', `
        <div class="service-cell-head">
          <span class="service-pill">${def.label}</span>
          <div class="service-price">${yen.format(p)} <span class="muted" style="font-size:11px">/月</span></div>
        </div>
        <div class="service-summary">${summaryLines(c)}</div>
        <div class="cell-actions">
          <button class="btn small" data-edit-row="${row.id}" data-edit-plan="${plan.id}">編集</button>
          ${canReplace ? `<button class="btn small subtle" data-replace-row="${row.id}" data-replace-plan="${plan.id}">別サービスに置換</button>` : ''}
          <button class="usage-toggle danger-link" data-remove-row="${row.id}" data-remove-plan="${plan.id}">この案から外す</button>
        </div>
      `));
    });
  });

  grid.appendChild(cell('grid-cell total-label', `<strong>TOTAL</strong><div class="service-desc">各案に実際に含まれるサービスの合計</div>`));
  plans.forEach(plan => {
    const total = totalForPlan(plan.id);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell total-cell', `<div class="total-price">${yen.format(total)}</div><div class="delta ${d.cls}">${d.text}</div>`));
  });

  renderBaselineSelect();
  wireGridActions();
  if (editing) updateDrawerFigures();
}

function renderBaselineSelect() {
  const select = document.getElementById('baselineSelect');
  select.innerHTML = plans.map(p => `<option value="${p.id}" ${p.id === baselineId ? 'selected' : ''}>${p.name}</option>`).join('');
  select.onchange = e => { baselineId = e.target.value; render(); };
}

function wireGridActions() {
  document.querySelectorAll('[data-duplicate]').forEach(btn => btn.onclick = () => duplicatePlan(btn.dataset.duplicate));
  document.querySelectorAll('[data-add-service]').forEach(btn => btn.onclick = () => openAddResourceModal(btn.dataset.addService));
  document.querySelectorAll('[data-edit-row]').forEach(btn => btn.onclick = () => openDrawer(btn.dataset.editPlan, btn.dataset.editRow));
  document.querySelectorAll('[data-replace-row]').forEach(btn => btn.onclick = () => openDrawer(btn.dataset.replacePlan, btn.dataset.replaceRow, true));
  document.querySelectorAll('[data-remove-row]').forEach(btn => {
    btn.onclick = () => {
      const row = rows.find(r => r.id === btn.dataset.removeRow);
      row.cells[btn.dataset.removePlan] = null;
      cleanupEmptyRows();
      render();
    };
  });
  document.querySelectorAll('[data-fill-row]').forEach(btn => {
    btn.onclick = () => {
      const row = rows.find(r => r.id === btn.dataset.fillRow);
      const service = row.allowed[0];
      row.cells[btn.dataset.fillPlan] = { service, config: serviceDefs[service].defaultConfig() };
      render();
    };
  });
}

function nextPlanId() {
  const ids = new Set(plans.map(p => p.id));
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode(65 + i);
    if (!ids.has(id)) return id;
  }
  return `P${plans.length + 1}`;
}

function duplicatePlan(sourceId) {
  const source = plans.find(p => p.id === sourceId);
  const newId = nextPlanId();
  plans.push({ id: newId, name: `案${newId}`, note: `${source.name}のコピー` });
  rows.forEach(row => {
    row.cells[newId] = row.cells[sourceId] ? JSON.parse(JSON.stringify(row.cells[sourceId])) : null;
  });
  render();
}

function addBlankPlan() {
  const newId = nextPlanId();
  plans.push({ id: newId, name: `案${newId}`, note: '新規案' });
  rows.forEach(row => { row.cells[newId] = null; });
  render();
}

function cleanupEmptyRows() {
  rows = rows.filter(row => plans.some(plan => !!row.cells[plan.id]));
}

function openDrawer(planId, rowId, focusReplace = false) {
  const row = rows.find(r => r.id === rowId);
  const entry = row.cells[planId];
  if (!entry) return;
  editing = { planId, rowId };
  const plan = plans.find(p => p.id === planId);
  document.getElementById('drawerPlan').textContent = `${plan.name} · 比較行: ${row.label}`;
  document.getElementById('drawerTitle').textContent = `${serviceDefs[entry.service].label} を編集`;

  let html = `<div class="mock-notice">価格はUI確認用のダミー値です。実装時は公開 Price List JSON を参照します。</div>`;

  if (row.allowed.length > 1) {
    html += `
      <div class="field replace-field ${focusReplace ? 'focus-field' : ''}">
        <label>この比較行で使うサービス</label>
        <select id="serviceSelect">
          ${row.allowed.map(key => `<option value="${key}" ${key === entry.service ? 'selected' : ''}>${serviceDefs[key].label}</option>`).join('')}
        </select>
        <div class="field-help">ここで切り替えると「置換」として同じ比較行に残ります。</div>
      </div>`;
  }

  html += editorFields(entry.service, entry.config);
  document.getElementById('drawerBody').innerHTML = html;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');

  const serviceSelect = document.getElementById('serviceSelect');
  if (serviceSelect) {
    serviceSelect.onchange = e => {
      const newService = e.target.value;
      row.cells[planId] = { service: newService, config: serviceDefs[newService].defaultConfig() };
      render();
      openDrawer(planId, rowId, false);
    };
  }
  wireEditorInputs(entry.service, entry.config);
  updateDrawerFigures();
}

function editorFields(serviceKey, config) {
  const def = serviceDefs[serviceKey];
  if (def.variants) {
    return `
      <div class="field">
        <label>Instance type</label>
        <select id="variantInput">
          ${Object.entries(def.variants).map(([name, spec]) => `<option value="${name}" ${name === config.variant ? 'selected' : ''}>${name} — ${spec.vcpu} vCPU / ${spec.memory} GiB / ${yen.format(spec.monthly)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Quantity</label>
        <input id="quantityInput" type="number" min="1" step="1" value="${config.quantity || 1}" />
      </div>`;
  }
  if (serviceKey === 's3' || serviceKey === 'ebs') {
    return `
      <div class="field"><label>容量 (GB)</label><input id="gbInput" type="number" min="0" step="10" value="${config.gb || 0}" /></div>
      <div class="field"><label>単価（UIモック用）</label><input id="rateInput" type="number" min="0" step="0.1" value="${config.rate || 0}" /></div>`;
  }
  if (serviceKey === 'lambda' || serviceKey === 'apiGateway') {
    return `
      <div class="field"><label>Requests / month (million)</label><input id="requestsInput" type="number" min="0" step="1" value="${config.requestsM || 0}" /></div>
      <div class="field"><label>月額（UIモック用）</label><input id="monthlyInput" type="number" min="0" step="100" value="${config.monthly || 0}" /></div>`;
  }
  if (serviceKey === 'auroraServerless') {
    return `
      <div class="field"><label>Average ACU</label><input id="acuInput" type="number" min="0.5" step="0.5" value="${config.acu || 0.5}" /></div>
      <div class="field"><label>月額（UIモック用）</label><input id="monthlyInput" type="number" min="0" step="100" value="${config.monthly || 0}" /></div>`;
  }
  return `<div class="field"><label>月額（UIモック用）</label><input id="monthlyInput" type="number" min="0" step="100" value="${config.monthly || 0}" /></div>`;
}

function wireEditorInputs(serviceKey, config) {
  const rerender = () => { render(); updateDrawerFigures(); };
  const variantInput = document.getElementById('variantInput');
  if (variantInput) variantInput.onchange = e => { config.variant = e.target.value; rerender(); };
  const quantityInput = document.getElementById('quantityInput');
  if (quantityInput) quantityInput.oninput = e => { config.quantity = Math.max(1, Number(e.target.value || 1)); rerender(); };
  const gbInput = document.getElementById('gbInput');
  if (gbInput) gbInput.oninput = e => { config.gb = Math.max(0, Number(e.target.value || 0)); rerender(); };
  const rateInput = document.getElementById('rateInput');
  if (rateInput) rateInput.oninput = e => { config.rate = Math.max(0, Number(e.target.value || 0)); rerender(); };
  const requestsInput = document.getElementById('requestsInput');
  if (requestsInput) requestsInput.oninput = e => { config.requestsM = Math.max(0, Number(e.target.value || 0)); rerender(); };
  const acuInput = document.getElementById('acuInput');
  if (acuInput) acuInput.oninput = e => { config.acu = Math.max(0.5, Number(e.target.value || 0.5)); rerender(); };
  const monthlyInput = document.getElementById('monthlyInput');
  if (monthlyInput) monthlyInput.oninput = e => { config.monthly = Math.max(0, Number(e.target.value || 0)); rerender(); };
}

function updateDrawerFigures() {
  if (!editing) return;
  const row = rows.find(r => r.id === editing.rowId);
  const entry = row?.cells[editing.planId];
  if (!entry) return;
  document.getElementById('drawerServicePrice').textContent = `${yen.format(priceForCell(entry))} /月`;
  document.getElementById('drawerPlanTotal').textContent = `${yen.format(totalForPlan(editing.planId))} /月`;
}

function closeDrawer() {
  editing = null;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
  refreshScrim();
}

function openAddResourceModal(planId) {
  addingToPlanId = planId;
  const plan = plans.find(p => p.id === planId);
  document.getElementById('addResourceTitle').textContent = `${plan.name} にサービスを追加`;
  const usedServices = new Set(rows.map(r => r.cells[planId]?.service).filter(Boolean));
  const choices = Object.keys(serviceDefs).filter(key => !usedServices.has(key));
  document.getElementById('servicePicker').innerHTML = choices.map(key => `
    <button class="service-option-button" data-add-key="${key}">
      <span class="service-icon small-icon">${serviceDefs[key].icon}</span>
      <span><strong>${serviceDefs[key].label}</strong><small>${serviceDefs[key].desc}</small></span>
    </button>`).join('') || '<div class="empty-picker">追加できるサービス候補がありません。</div>';
  document.querySelectorAll('[data-add-key]').forEach(btn => {
    btn.onclick = () => {
      addUniqueService(planId, btn.dataset.addKey);
      closeAddResourceModal();
    };
  });
  document.getElementById('addResourceModal').classList.add('open');
  document.getElementById('addResourceModal').setAttribute('aria-hidden', 'false');
  document.getElementById('scrim').classList.add('open');
}

function addUniqueService(planId, serviceKey) {
  const id = `custom-${serviceKey}-${Date.now()}`;
  const cells = {};
  plans.forEach(p => { cells[p.id] = null; });
  cells[planId] = { service: serviceKey, config: serviceDefs[serviceKey].defaultConfig() };
  rows.push({ id, label: serviceDefs[serviceKey].label, kind: 'unique', allowed: [serviceKey], cells });
  render();
}

function closeAddResourceModal() {
  addingToPlanId = null;
  document.getElementById('addResourceModal').classList.remove('open');
  document.getElementById('addResourceModal').setAttribute('aria-hidden', 'true');
  refreshScrim();
}

function refreshScrim() {
  const anyOpen = document.getElementById('drawer').classList.contains('open') || document.getElementById('addResourceModal').classList.contains('open');
  document.getElementById('scrim').classList.toggle('open', anyOpen);
}

document.getElementById('closeDrawer').onclick = closeDrawer;
document.getElementById('closeAddResource').onclick = closeAddResourceModal;
document.getElementById('cancelAddResource').onclick = closeAddResourceModal;
document.getElementById('scrim').onclick = () => { closeDrawer(); closeAddResourceModal(); };
document.getElementById('addPlan').onclick = addBlankPlan;
document.getElementById('recalcAll').onclick = () => {
  const btn = document.getElementById('recalcAll');
  const original = btn.textContent;
  btn.textContent = '✓ 再計算済み';
  render();
  setTimeout(() => { btn.textContent = original; }, 900);
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawer(); closeAddResourceModal(); }
});

render();
