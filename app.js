const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const regionNames = {
  'ap-northeast-1': 'Tokyo',
  'ap-northeast-3': 'Osaka',
  'us-east-1': 'N. Virginia',
  'us-west-2': 'Oregon'
};

let projectRegion = 'ap-northeast-1';

const serviceDefs = {
  ec2: {
    label: 'EC2', icon: 'EC2', desc: 'Compute',
    variants: {
      'm7i.large': { vcpu: 2, memory: 8, monthly: 93.44 },
      'm7i.xlarge': { vcpu: 4, memory: 16, monthly: 186.88 },
      'm7i.2xlarge': { vcpu: 8, memory: 32, monthly: 373.76 },
      'r7i.xlarge': { vcpu: 4, memory: 32, monthly: 252.00 }
    },
    defaultConfig: () => ({ variant: 'm7i.large', quantity: 1 })
  },
  lambda: { label: 'Lambda', icon: 'λ', desc: 'Serverless compute', defaultConfig: () => ({ requestsM: 5, monthly: 18.20 }) },
  rds: {
    label: 'RDS', icon: 'RDS', desc: 'Managed database',
    variants: {
      'db.t4g.medium': { vcpu: 2, memory: 4, monthly: 64.80 },
      'db.m7g.large': { vcpu: 2, memory: 8, monthly: 121.40 },
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 194.20 }
    },
    defaultConfig: () => ({ variant: 'db.t4g.medium', quantity: 1 })
  },
  aurora: {
    label: 'Aurora', icon: 'AUR', desc: 'Aurora provisioned',
    variants: {
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 168.50 },
      'db.r7g.xlarge': { vcpu: 4, memory: 32, monthly: 337.00 }
    },
    defaultConfig: () => ({ variant: 'db.r7g.large', quantity: 1 })
  },
  auroraServerless: { label: 'Aurora Serverless', icon: 'AUR', desc: 'Aurora Serverless v2', defaultConfig: () => ({ acu: 2, monthly: 112.00 }) },
  s3: { label: 'S3', icon: 'S3', desc: 'Object storage', defaultConfig: () => ({ gb: 500, rate: 0.025 }) },
  ebs: { label: 'EBS', icon: 'EBS', desc: 'Block storage', defaultConfig: () => ({ gb: 200, rate: 0.096 }) },
  alb: { label: 'ALB', icon: 'ALB', desc: 'Load balancer', defaultConfig: () => ({ monthly: 22.50 }) },
  apiGateway: { label: 'API Gateway', icon: 'API', desc: 'Managed API endpoint', defaultConfig: () => ({ requestsM: 5, monthly: 17.50 }) },
  cloudfront: { label: 'CloudFront', icon: 'CF', desc: 'CDN', defaultConfig: () => ({ gb: 300, monthly: 34.00 }) },
  nat: { label: 'NAT Gateway', icon: 'NAT', desc: 'Network egress', defaultConfig: () => ({ monthly: 39.60 }) }
};

let rows = [
  {
    id: 'compute', label: 'EC2 / Lambda', kind: 'linked', allowed: ['ec2', 'lambda'],
    cells: {
      A: { service: 'ec2', config: { variant: 'm7i.large', quantity: 2 } },
      B: { service: 'ec2', config: { variant: 'm7i.xlarge', quantity: 2 } },
      C: { service: 'lambda', config: { requestsM: 5, monthly: 18.20 } }
    }
  },
  {
    id: 'database', label: 'RDS / Aurora', kind: 'linked', allowed: ['rds', 'aurora', 'auroraServerless'],
    cells: {
      A: { service: 'rds', config: { variant: 'db.t4g.medium', quantity: 1 } },
      B: { service: 'aurora', config: { variant: 'db.r7g.large', quantity: 1 } },
      C: { service: 'auroraServerless', config: { acu: 2, monthly: 112.00 } }
    }
  },
  {
    id: 's3', label: 'S3', kind: 'linked', allowed: ['s3'],
    cells: {
      A: { service: 's3', config: { gb: 500, rate: 0.025 } },
      B: { service: 's3', config: { gb: 500, rate: 0.025 } },
      C: { service: 's3', config: { gb: 1000, rate: 0.025 } }
    }
  },
  {
    id: 'alb', label: 'ALB', kind: 'unique', allowed: ['alb'],
    cells: {
      A: { service: 'alb', config: { monthly: 22.50 } },
      B: { service: 'alb', config: { monthly: 22.50 } },
      C: null
    }
  },
  {
    id: 'api-gateway', label: 'API Gateway', kind: 'unique', allowed: ['apiGateway'],
    cells: { A: null, B: null, C: { service: 'apiGateway', config: { requestsM: 5, monthly: 17.50 } } }
  },
  {
    id: 'ebs', label: 'EBS', kind: 'unique', allowed: ['ebs'],
    cells: {
      A: { service: 'ebs', config: { gb: 200, rate: 0.096 } },
      B: { service: 'ebs', config: { gb: 300, rate: 0.096 } },
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
  if (Math.abs(d) < 0.005) return { text: '基準', cls: '' };
  return { text: `${d > 0 ? '+' : '−'}${usd.format(Math.abs(d))}`, cls: d > 0 ? 'up' : 'down' };
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
  return `<div class="row-title-wrap"><div class="row-icons">${icons || '<span class="mini-service muted-box">—</span>'}</div><div><div class="service-name">${row.label}</div><div class="service-desc">${suffix}</div></div></div>`;
}

function summaryLines(cell) {
  if (!cell) return '<div class="summary-line muted">この案では使用しません</div>';
  const def = serviceDefs[cell.service];
  const c = cell.config;
  let detail = '';
  if (def.variants) {
    const spec = def.variants[c.variant];
    detail = `<div class="summary-line">${c.variant} × ${c.quantity || 1}</div><div class="summary-line">${spec.vcpu} vCPU · ${spec.memory} GiB / instance</div>`;
  } else if (cell.service === 's3' || cell.service === 'ebs') {
    detail = `<div class="summary-line">${Number(c.gb || 0).toLocaleString()} GB</div><div class="summary-line">${usd.format(c.rate || 0)} / GB-month</div>`;
  } else if (cell.service === 'lambda' || cell.service === 'apiGateway') {
    detail = `<div class="summary-line">${c.requestsM || 0}M requests / month</div>`;
  } else if (cell.service === 'auroraServerless') {
    detail = `<div class="summary-line">${c.acu || 0} ACU average</div>`;
  } else {
    detail = '<div class="summary-line">UIモック用利用量</div>';
  }
  return `${detail}<div class="summary-line region-summary">Region: Project default (${regionNames[projectRegion]})</div>`;
}

function render() {
  const grid = document.getElementById('comparisonGrid');
  grid.style.setProperty('--plan-count', plans.length);
  grid.innerHTML = '';
  const baseTotal = totalForPlan(baselineId);

  grid.appendChild(cell('grid-cell row-label header-cell', `<div class="eyebrow dark">COMPARISON</div><div style="margin-top:10px;font-weight:750">構成そのものも比較</div><div class="service-desc">同じ行＝比較したい項目。役割名の入力は不要。</div>`));

  plans.forEach(plan => {
    const total = totalForPlan(plan.id);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell header-cell plan', `
      <div class="plan-head">
        <div><div class="plan-name">${plan.name}</div><div class="plan-note">${plan.note}</div></div>
        <div class="plan-actions">
          <button class="btn small" data-duplicate="${plan.id}">複製</button>
          ${plans.length > 1 ? `<button class="btn small danger-btn" data-delete-plan="${plan.id}">削除</button>` : ''}
        </div>
      </div>
      <div class="plan-total">${usd.format(total)}<span class="muted" style="font-size:12px"> /月</span></div>
      <div class="delta ${d.cls}">${d.text}</div>
      <button class="add-service-inline" data-add-service="${plan.id}">＋ この案にサービス追加</button>`));
  });

  rows.forEach(row => {
    grid.appendChild(cell(`grid-cell row-label ${row.kind === 'unique' ? 'unique-row' : ''}`, rowLabelHtml(row)));
    plans.forEach(plan => {
      const c = row.cells[plan.id] || null;
      if (!c) {
        grid.appendChild(cell('grid-cell service-cell empty-cell', `<div class="empty-mark">—</div><div class="service-summary">${summaryLines(null)}</div><div class="cell-actions"><button class="btn small subtle" data-fill-row="${row.id}" data-fill-plan="${plan.id}">この行に追加</button></div>`));
        return;
      }
      const def = serviceDefs[c.service];
      const p = priceForCell(c);
      const canReplace = row.allowed.length > 1;
      grid.appendChild(cell('grid-cell service-cell', `
        <div class="service-cell-head"><span class="service-pill">${def.label}</span><div class="service-price">${usd.format(p)} <span class="muted" style="font-size:11px">/月</span></div></div>
        <div class="service-summary">${summaryLines(c)}</div>
        <div class="cell-actions"><button class="btn small" data-edit-row="${row.id}" data-edit-plan="${plan.id}">編集</button>${canReplace ? `<button class="btn small subtle" data-replace-row="${row.id}" data-replace-plan="${plan.id}">別サービスに置換</button>` : ''}<button class="usage-toggle danger-link" data-remove-row="${row.id}" data-remove-plan="${plan.id}">この案から外す</button></div>`));
    });
  });

  grid.appendChild(cell('grid-cell total-label', `<strong>TOTAL</strong><div class="service-desc">USD / On-Demand / 税・割引なし</div>`));
  plans.forEach(plan => {
    const total = totalForPlan(plan.id);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell total-cell', `<div class="total-price">${usd.format(total)}</div><div class="delta ${d.cls}">${d.text}</div>`));
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
  document.querySelectorAll('[data-delete-plan]').forEach(btn => btn.onclick = () => deletePlan(btn.dataset.deletePlan));
  document.querySelectorAll('[data-add-service]').forEach(btn => btn.onclick = () => openAddResourceModal(btn.dataset.addService));
  document.querySelectorAll('[data-edit-row]').forEach(btn => btn.onclick = () => openDrawer(btn.dataset.editPlan, btn.dataset.editRow, false));
  document.querySelectorAll('[data-replace-row]').forEach(btn => btn.onclick = () => openDrawer(btn.dataset.replacePlan, btn.dataset.replaceRow, true));
  document.querySelectorAll('[data-remove-row]').forEach(btn => btn.onclick = () => {
    const row = rows.find(r => r.id === btn.dataset.removeRow);
    row.cells[btn.dataset.removePlan] = null;
    cleanupEmptyRows();
    render();
  });
  document.querySelectorAll('[data-fill-row]').forEach(btn => btn.onclick = () => {
    const row = rows.find(r => r.id === btn.dataset.fillRow);
    const service = row.allowed[0];
    row.cells[btn.dataset.fillPlan] = { service, config: serviceDefs[service].defaultConfig() };
    render();
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
  rows.forEach(row => { row.cells[newId] = row.cells[sourceId] ? JSON.parse(JSON.stringify(row.cells[sourceId])) : null; });
  render();
}

function addBlankPlan() {
  const newId = nextPlanId();
  plans.push({ id: newId, name: `案${newId}`, note: '新規案' });
  rows.forEach(row => { row.cells[newId] = null; });
  render();
}

function deletePlan(planId) {
  if (plans.length <= 1) return;
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;
  if (!window.confirm(`${plan.name} を削除しますか？\nこの案にだけ含まれるサービス設定も削除されます。`)) return;

  plans = plans.filter(p => p.id !== planId);
  rows.forEach(row => { delete row.cells[planId]; });
  cleanupEmptyRows();

  if (baselineId === planId) baselineId = plans[0].id;
  if (editing?.planId === planId) closeDrawer();
  if (addingToPlanId === planId) closeAddResourceModal();
  render();
}

function openDrawer(planId, rowId, replacing = false) {
  const row = rows.find(r => r.id === rowId);
  const current = row.cells[planId];
  editing = { planId, rowId };
  const plan = plans.find(p => p.id === planId);
  document.getElementById('drawerPlan').textContent = plan.name;
  document.getElementById('drawerTitle').textContent = replacing ? 'サービスを置換' : `${serviceDefs[current.service].label} を編集`;

  if (replacing) {
    document.getElementById('drawerBody').innerHTML = `<div class="mock-notice">同じ比較行のままAWSサービスだけを置き換えます。</div><div class="field focus-field"><label>Service</label><select id="replaceService">${row.allowed.map(key => `<option value="${key}" ${current?.service === key ? 'selected' : ''}>${serviceDefs[key].label}</option>`).join('')}</select></div>`;
    document.getElementById('replaceService').onchange = e => {
      const service = e.target.value;
      row.cells[planId] = { service, config: serviceDefs[service].defaultConfig() };
      closeDrawer();
      render();
    };
  } else {
    const def = serviceDefs[current.service];
    const c = current.config;
    let html = `<div class="mock-notice">価格はUI確認用ダミー値です。実装時は選択中リージョンのPublic Price List JSONを参照します。</div><div class="field"><label>Region</label><select disabled><option>Project default — ${regionNames[projectRegion]} (${projectRegion})</option></select><div class="field-help">本実装ではここから個別Region overrideも可能にする想定。</div></div>`;
    if (def.variants) {
      html += `<div class="field"><label>Instance type</label><select id="variantSelect">${Object.entries(def.variants).map(([name, spec]) => `<option value="${name}" ${name === c.variant ? 'selected' : ''}>${name} — ${spec.vcpu} vCPU / ${spec.memory} GiB / ${usd.format(spec.monthly)}</option>`).join('')}</select></div><div class="field"><label>Quantity</label><input id="quantityInput" type="number" min="1" step="1" value="${c.quantity || 1}" /></div>`;
    } else if (current.service === 's3' || current.service === 'ebs') {
      html += `<div class="field"><label>容量 (GB)</label><input id="gbInput" type="number" min="0" step="10" value="${c.gb || 0}" /></div>`;
    } else if (current.service === 'lambda' || current.service === 'apiGateway') {
      html += `<div class="field"><label>Requests / month (million)</label><input id="requestsInput" type="number" min="0" step="1" value="${c.requestsM || 0}" /></div>`;
    } else if (current.service === 'auroraServerless') {
      html += `<div class="field"><label>Average ACU</label><input id="acuInput" type="number" min="0" step="0.5" value="${c.acu || 0}" /></div>`;
    } else {
      html += `<div class="field"><label>Monthly mock price (USD)</label><input id="monthlyInput" type="number" min="0" step="0.01" value="${c.monthly || 0}" /></div>`;
    }
    document.getElementById('drawerBody').innerHTML = html;
    wireDrawerInputs(current);
  }

  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('open');
  updateDrawerFigures();
}

function wireDrawerInputs(current) {
  const c = current.config;
  const variant = document.getElementById('variantSelect');
  if (variant) variant.onchange = e => { c.variant = e.target.value; render(); };
  const qty = document.getElementById('quantityInput');
  if (qty) qty.oninput = e => { c.quantity = Math.max(1, Number(e.target.value || 1)); render(); };
  const gb = document.getElementById('gbInput');
  if (gb) gb.oninput = e => { c.gb = Math.max(0, Number(e.target.value || 0)); render(); };
  const req = document.getElementById('requestsInput');
  if (req) req.oninput = e => { c.requestsM = Math.max(0, Number(e.target.value || 0)); c.monthly = c.requestsM * 3.5; render(); };
  const acu = document.getElementById('acuInput');
  if (acu) acu.oninput = e => { c.acu = Math.max(0, Number(e.target.value || 0)); c.monthly = c.acu * 56; render(); };
  const monthly = document.getElementById('monthlyInput');
  if (monthly) monthly.oninput = e => { c.monthly = Math.max(0, Number(e.target.value || 0)); render(); };
}

function updateDrawerFigures() {
  if (!editing) return;
  const row = rows.find(r => r.id === editing.rowId);
  const c = row?.cells[editing.planId];
  document.getElementById('drawerServicePrice').textContent = `${usd.format(priceForCell(c))} /月`;
  document.getElementById('drawerPlanTotal').textContent = `${usd.format(totalForPlan(editing.planId))} /月`;
}

function closeDrawer() {
  editing = null;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
}

function openAddResourceModal(planId) {
  addingToPlanId = planId;
  document.getElementById('addResourceTitle').textContent = `${plans.find(p => p.id === planId).name} にサービスを追加`;
  document.getElementById('servicePicker').innerHTML = Object.entries(serviceDefs).map(([key, def]) => `<button class="service-option-button" data-service-key="${key}"><span class="service-icon small-icon">${def.icon}</span><span><strong>${def.label}</strong><small>${def.desc}</small></span></button>`).join('');
  document.querySelectorAll('[data-service-key]').forEach(btn => btn.onclick = () => addResourceToPlan(planId, btn.dataset.serviceKey));
  document.getElementById('addResourceModal').classList.add('open');
  document.getElementById('scrim').classList.add('open');
}

function addResourceToPlan(planId, serviceKey) {
  const rowId = `${serviceKey}-${Date.now()}`;
  const cells = {};
  plans.forEach(p => { cells[p.id] = null; });
  cells[planId] = { service: serviceKey, config: serviceDefs[serviceKey].defaultConfig() };
  rows.push({ id: rowId, label: serviceDefs[serviceKey].label, kind: 'unique', allowed: [serviceKey], cells });
  closeAddResourceModal();
  render();
}

function closeAddResourceModal() {
  addingToPlanId = null;
  document.getElementById('addResourceModal').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
}

function cleanupEmptyRows() {
  rows = rows.filter(row => plans.some(p => row.cells[p.id]));
}

document.getElementById('regionSelect').onchange = e => {
  projectRegion = e.target.value;
  document.getElementById('regionInheritance').innerHTML = `<b>Default region</b> ${regionNames[projectRegion]}`;
  render();
};
document.getElementById('addPlan').onclick = addBlankPlan;
document.getElementById('closeDrawer').onclick = closeDrawer;
document.getElementById('closeAddResource').onclick = closeAddResourceModal;
document.getElementById('cancelAddResource').onclick = closeAddResourceModal;
document.getElementById('scrim').onclick = () => { closeDrawer(); closeAddResourceModal(); };
document.getElementById('recalcAll').onclick = () => {
  const btn = document.getElementById('recalcAll');
  const original = btn.textContent;
  btn.textContent = '✓ 再計算済み';
  setTimeout(() => btn.textContent = original, 900);
  render();
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeAddResourceModal(); } });

render();