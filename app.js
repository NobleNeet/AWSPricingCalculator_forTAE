const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

const serviceDefs = {
  ec2: {
    label: 'EC2', icon: 'EC2', desc: 'Compute',
    instances: {
      'm7i.large': { vcpu: 2, memory: 8, monthly: 28400 },
      'm7i.xlarge': { vcpu: 4, memory: 16, monthly: 42700 },
      'm7i.2xlarge': { vcpu: 8, memory: 32, monthly: 81200 },
      'r7i.xlarge': { vcpu: 4, memory: 32, monthly: 61300 }
    },
    defaultConfig: () => ({ enabled: true, instance: 'm7i.large', quantity: 1 })
  },
  rds: {
    label: 'RDS', icon: 'RDS', desc: 'Database',
    instances: {
      'db.t4g.medium': { vcpu: 2, memory: 4, monthly: 18200 },
      'db.m7g.large': { vcpu: 2, memory: 8, monthly: 30400 },
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 48500 }
    },
    defaultConfig: () => ({ enabled: true, instance: 'db.t4g.medium', quantity: 1 })
  },
  s3: {
    label: 'S3', icon: 'S3', desc: 'Object storage',
    defaultConfig: () => ({ enabled: true, gb: 100, rate: 7.6 })
  },
  ebs: {
    label: 'EBS', icon: 'EBS', desc: 'Block storage',
    defaultConfig: () => ({ enabled: true, gb: 100, rate: 12 })
  },
  elasticache: {
    label: 'ElastiCache', icon: 'EC', desc: 'In-memory cache',
    defaultConfig: () => ({ enabled: true, gb: 1, rate: 12000 })
  },
  nat: {
    label: 'NAT Gateway', icon: 'NAT', desc: 'Network',
    defaultConfig: () => ({ enabled: true, gb: 1, rate: 6500 })
  }
};

let projectServices = ['ec2', 'rds', 's3', 'ebs'];

let plans = [
  {
    id: 'A', name: '案A', note: '現在案',
    services: {
      ec2: { enabled: true, instance: 'm7i.large', quantity: 2 },
      rds: { enabled: true, instance: 'db.t4g.medium', quantity: 1 },
      s3: { enabled: true, gb: 500, rate: 7.6 },
      ebs: { enabled: true, gb: 200, rate: 12 }
    }
  },
  {
    id: 'B', name: '案B', note: '性能寄り',
    services: {
      ec2: { enabled: true, instance: 'm7i.xlarge', quantity: 2 },
      rds: { enabled: true, instance: 'db.m7g.large', quantity: 1 },
      s3: { enabled: true, gb: 500, rate: 7.6 },
      ebs: { enabled: true, gb: 300, rate: 12 }
    }
  },
  {
    id: 'C', name: '案C', note: '余裕あり',
    services: {
      ec2: { enabled: true, instance: 'r7i.xlarge', quantity: 2 },
      rds: { enabled: true, instance: 'db.r7g.large', quantity: 1 },
      s3: { enabled: true, gb: 1000, rate: 7.1 },
      ebs: { enabled: true, gb: 500, rate: 12 }
    }
  }
];

let baselineId = 'A';
let editing = null;
let serviceDraft = null;

function ensurePlanHasProjectServices(plan) {
  projectServices.forEach(key => {
    if (!plan.services[key]) plan.services[key] = serviceDefs[key].defaultConfig();
  });
}

function priceFor(serviceKey, config) {
  if (!config || config.enabled === false) return 0;
  const def = serviceDefs[serviceKey];
  if (def.instances) return def.instances[config.instance].monthly * config.quantity;
  if (serviceKey === 's3' || serviceKey === 'ebs') return config.gb * config.rate;
  if (serviceKey === 'elasticache' || serviceKey === 'nat') return config.gb * config.rate;
  return 0;
}

function totalFor(plan) {
  return projectServices.reduce((sum, key) => sum + priceFor(key, plan.services[key]), 0);
}

function deltaText(value, base) {
  const d = value - base;
  if (d === 0) return { text: '基準', cls: '' };
  return { text: `${d > 0 ? '+' : '−'}${yen.format(Math.abs(d))}`, cls: d > 0 ? 'up' : 'down' };
}

function renderServiceChips() {
  const target = document.getElementById('serviceChips');
  target.innerHTML = projectServices.map(key => `<span class="service-chip"><span class="dot"></span>${serviceDefs[key].label}</span>`).join('');
}

function render() {
  plans.forEach(ensurePlanHasProjectServices);
  renderServiceChips();

  const grid = document.getElementById('comparisonGrid');
  grid.style.setProperty('--plan-count', plans.length);
  grid.innerHTML = '';

  const baseline = plans.find(p => p.id === baselineId) || plans[0];
  const baseTotal = totalFor(baseline);

  grid.appendChild(cell('grid-cell row-label header-cell', `
    <div class="eyebrow dark">PROJECT TOTAL</div>
    <div style="margin-top:10px;font-weight:750">同じシステム構成を比較</div>
    <div class="service-desc">サービス行は全案共通。各セルではスペックと利用量だけを変更。</div>
  `));

  plans.forEach(plan => {
    const total = totalFor(plan);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell header-cell plan', `
      <div class="plan-head">
        <div><div class="plan-name">${plan.name}</div><div class="plan-note">${plan.note}</div></div>
        <button class="btn small" data-duplicate="${plan.id}">複製</button>
      </div>
      <div class="plan-total">${yen.format(total)}<span class="muted" style="font-size:12px"> /月</span></div>
      <div class="delta ${d.cls}">${d.text}</div>
    `));
  });

  projectServices.forEach(serviceKey => {
    const def = serviceDefs[serviceKey];
    grid.appendChild(cell('grid-cell row-label', `
      <div class="service-row-label">
        <div class="service-icon">${def.icon}</div>
        <div><div class="service-name">${def.label}</div><div class="service-desc">${def.desc}</div></div>
      </div>
    `));

    plans.forEach(plan => {
      const config = plan.services[serviceKey];
      const enabled = config.enabled !== false;
      const p = priceFor(serviceKey, config);
      grid.appendChild(cell(`grid-cell service-cell ${enabled ? '' : 'off'}`, enabled ? `
        <div class="service-price">${yen.format(p)} <span class="muted" style="font-size:11px">/月</span></div>
        <div class="service-summary">${summaryLines(serviceKey, config)}</div>
        <div class="cell-actions">
          <button class="btn small" data-edit-plan="${plan.id}" data-edit-service="${serviceKey}">編集</button>
          <button class="usage-toggle" data-toggle-plan="${plan.id}" data-toggle-service="${serviceKey}">この案では使わない</button>
        </div>
      ` : `
        <div class="service-price">使用しない</div>
        <div class="service-summary"><div class="summary-line">このサービスはProjectには含まれますが、${plan.name}では無効です。</div></div>
        <div class="cell-actions"><button class="btn small" data-toggle-plan="${plan.id}" data-toggle-service="${serviceKey}">使用する</button></div>
      `));
    });
  });

  grid.appendChild(cell('grid-cell total-label', `<strong>TOTAL</strong><div class="service-desc">Project共通サービスの合計</div>`));
  plans.forEach(plan => {
    const total = totalFor(plan);
    const d = deltaText(total, baseTotal);
    grid.appendChild(cell('grid-cell total-cell', `<div class="total-price">${yen.format(total)}</div><div class="delta ${d.cls}">${d.text}</div>`));
  });

  renderBaselineSelect();
  wireGridActions();
  if (editing) updateDrawerFigures();
}

function cell(cls, html) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  return el;
}

function summaryLines(key, c) {
  if (serviceDefs[key].instances) {
    const spec = serviceDefs[key].instances[c.instance];
    return `<div class="summary-line">${c.instance} × ${c.quantity}</div><div class="summary-line">${spec.vcpu} vCPU · ${spec.memory} GiB / instance</div>`;
  }
  if (key === 's3' || key === 'ebs') return `<div class="summary-line">${c.gb.toLocaleString()} GB</div><div class="summary-line">${yen.format(c.rate)} / GB-month</div>`;
  return `<div class="summary-line">利用量係数 ${c.gb}</div><div class="summary-line">UIモック単価 ${yen.format(c.rate)}</div>`;
}

function renderBaselineSelect() {
  const select = document.getElementById('baselineSelect');
  select.innerHTML = plans.map(p => `<option value="${p.id}" ${p.id === baselineId ? 'selected' : ''}>${p.name}</option>`).join('');
  select.onchange = e => { baselineId = e.target.value; render(); };
}

function wireGridActions() {
  document.querySelectorAll('[data-edit-plan]').forEach(btn => {
    btn.onclick = () => openDrawer(btn.dataset.editPlan, btn.dataset.editService);
  });
  document.querySelectorAll('[data-duplicate]').forEach(btn => {
    btn.onclick = () => duplicatePlan(btn.dataset.duplicate);
  });
  document.querySelectorAll('[data-toggle-plan]').forEach(btn => {
    btn.onclick = () => {
      const plan = plans.find(p => p.id === btn.dataset.togglePlan);
      const config = plan.services[btn.dataset.toggleService];
      config.enabled = config.enabled === false;
      render();
    };
  });
}

function nextPlanId() {
  return String.fromCharCode(65 + plans.length);
}

function duplicatePlan(id) {
  const source = plans.find(p => p.id === id);
  const newId = nextPlanId();
  plans.push({
    id: newId,
    name: `案${newId}`,
    note: `${source.name}のコピー`,
    services: JSON.parse(JSON.stringify(source.services))
  });
  render();
}

function addBlankPlan() {
  const newId = nextPlanId();
  const services = {};
  projectServices.forEach(key => { services[key] = serviceDefs[key].defaultConfig(); });
  plans.push({ id: newId, name: `案${newId}`, note: '新規案', services });
  render();
}

function openDrawer(planId, serviceKey) {
  editing = { planId, serviceKey };
  const plan = plans.find(p => p.id === planId);
  const def = serviceDefs[serviceKey];
  const c = plan.services[serviceKey];
  document.getElementById('drawerPlan').textContent = plan.name;
  document.getElementById('drawerTitle').textContent = `${def.label} を編集`;

  let html = `<div class="mock-notice">このモックの価格はUI確認用のダミー値です。実装時は公開 Price List JSON を参照します。</div>`;
  if (def.instances) {
    html += `
      <div class="field">
        <label>Instance type</label>
        <select id="instanceSelect">
          ${Object.entries(def.instances).map(([name, spec]) => `<option value="${name}" ${name === c.instance ? 'selected' : ''}>${name} — ${spec.vcpu} vCPU / ${spec.memory} GiB / ${yen.format(spec.monthly)}</option>`).join('')}
        </select>
        <div class="field-help">本実装ではスペック条件から絞り込むPickerへ拡張する想定。</div>
      </div>
      <div class="field">
        <label>Quantity</label>
        <input id="quantityInput" type="number" min="1" step="1" value="${c.quantity}" />
      </div>
      <div class="inline-price"><span>選択中インスタンス</span><strong id="instanceSpec"></strong></div>`;
  } else {
    html += `
      <div class="field">
        <label>${serviceKey === 's3' || serviceKey === 'ebs' ? '容量 (GB)' : '利用量係数'}</label>
        <input id="gbInput" type="number" min="0" step="1" value="${c.gb}" />
      </div>
      <div class="field">
        <label>単価（UIモック用）</label>
        <input id="rateInput" type="number" min="0" step="0.1" value="${c.rate}" />
        <div class="field-help">実装時はユーザー入力ではなくPrice Listから解決。</div>
      </div>`;
  }
  document.getElementById('drawerBody').innerHTML = html;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');

  if (def.instances) {
    document.getElementById('instanceSelect').onchange = e => { c.instance = e.target.value; render(); refreshDrawerSpec(); };
    document.getElementById('quantityInput').oninput = e => { c.quantity = Math.max(1, Number(e.target.value || 1)); render(); };
    refreshDrawerSpec();
  } else {
    document.getElementById('gbInput').oninput = e => { c.gb = Math.max(0, Number(e.target.value || 0)); render(); };
    document.getElementById('rateInput').oninput = e => { c.rate = Math.max(0, Number(e.target.value || 0)); render(); };
  }
  updateDrawerFigures();
}

function refreshDrawerSpec() {
  if (!editing) return;
  const plan = plans.find(p => p.id === editing.planId);
  const c = plan.services[editing.serviceKey];
  const def = serviceDefs[editing.serviceKey];
  if (!def.instances) return;
  const spec = def.instances[c.instance];
  const target = document.getElementById('instanceSpec');
  if (target) target.textContent = `${spec.vcpu} vCPU / ${spec.memory} GiB`;
}

function updateDrawerFigures() {
  if (!editing) return;
  const plan = plans.find(p => p.id === editing.planId);
  if (!plan) return;
  document.getElementById('drawerServicePrice').textContent = `${yen.format(priceFor(editing.serviceKey, plan.services[editing.serviceKey]))} /月`;
  document.getElementById('drawerPlanTotal').textContent = `${yen.format(totalFor(plan))} /月`;
}

function closeDrawer() {
  editing = null;
  document.getElementById('drawer').classList.remove('open');
  if (!document.getElementById('serviceModal').classList.contains('open')) document.getElementById('scrim').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
}

function openServiceModal() {
  serviceDraft = new Set(projectServices);
  const picker = document.getElementById('servicePicker');
  picker.innerHTML = Object.entries(serviceDefs).map(([key, def]) => `
    <label class="service-option">
      <input type="checkbox" value="${key}" ${serviceDraft.has(key) ? 'checked' : ''} />
      <div><strong>${def.label}</strong><span>${def.desc}</span></div>
    </label>
  `).join('');
  picker.querySelectorAll('input').forEach(input => {
    input.onchange = () => input.checked ? serviceDraft.add(input.value) : serviceDraft.delete(input.value);
  });
  document.getElementById('serviceModal').classList.add('open');
  document.getElementById('serviceModal').setAttribute('aria-hidden', 'false');
  document.getElementById('scrim').classList.add('open');
}

function closeServiceModal() {
  serviceDraft = null;
  document.getElementById('serviceModal').classList.remove('open');
  document.getElementById('serviceModal').setAttribute('aria-hidden', 'true');
  if (!document.getElementById('drawer').classList.contains('open')) document.getElementById('scrim').classList.remove('open');
}

function applyServices() {
  if (!serviceDraft || serviceDraft.size === 0) return;
  projectServices = Object.keys(serviceDefs).filter(key => serviceDraft.has(key));
  plans.forEach(ensurePlanHasProjectServices);
  closeServiceModal();
  render();
}

document.getElementById('closeDrawer').onclick = closeDrawer;
document.getElementById('scrim').onclick = () => {
  if (document.getElementById('serviceModal').classList.contains('open')) closeServiceModal();
  else closeDrawer();
};
document.getElementById('recalcAll').onclick = () => {
  const btn = document.getElementById('recalcAll');
  const original = btn.textContent;
  btn.textContent = '✓ 再計算済み';
  setTimeout(() => btn.textContent = original, 900);
  render();
};
document.getElementById('addPlan').onclick = addBlankPlan;
document.getElementById('manageServices').onclick = openServiceModal;
document.getElementById('closeServiceModal').onclick = closeServiceModal;
document.getElementById('cancelServiceModal').onclick = closeServiceModal;
document.getElementById('applyServices').onclick = applyServices;

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('serviceModal').classList.contains('open')) closeServiceModal();
  else closeDrawer();
});

render();
