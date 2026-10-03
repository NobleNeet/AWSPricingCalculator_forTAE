const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

const serviceDefs = {
  ec2: {
    label: 'EC2', icon: 'EC2', desc: 'Compute',
    instances: {
      'm7i.large': { vcpu: 2, memory: 8, monthly: 28400 },
      'm7i.xlarge': { vcpu: 4, memory: 16, monthly: 42700 },
      'm7i.2xlarge': { vcpu: 8, memory: 32, monthly: 81200 },
      'r7i.xlarge': { vcpu: 4, memory: 32, monthly: 61300 }
    }
  },
  rds: {
    label: 'RDS', icon: 'RDS', desc: 'Database',
    instances: {
      'db.t4g.medium': { vcpu: 2, memory: 4, monthly: 18200 },
      'db.m7g.large': { vcpu: 2, memory: 8, monthly: 30400 },
      'db.r7g.large': { vcpu: 2, memory: 16, monthly: 48500 }
    }
  },
  s3: { label: 'S3', icon: 'S3', desc: 'Object storage' },
  ebs: { label: 'EBS', icon: 'EBS', desc: 'Block storage' }
};

let plans = [
  {
    id: 'A', name: '案A', note: '現在案',
    services: {
      ec2: { instance: 'm7i.large', quantity: 2 },
      rds: { instance: 'db.t4g.medium', quantity: 1 },
      s3: { gb: 500, rate: 7.6 },
      ebs: { gb: 200, rate: 12 }
    }
  },
  {
    id: 'B', name: '案B', note: '性能寄り',
    services: {
      ec2: { instance: 'm7i.xlarge', quantity: 2 },
      rds: { instance: 'db.m7g.large', quantity: 1 },
      s3: { gb: 500, rate: 7.6 },
      ebs: { gb: 300, rate: 12 }
    }
  },
  {
    id: 'C', name: '案C', note: '余裕あり',
    services: {
      ec2: { instance: 'r7i.xlarge', quantity: 2 },
      rds: { instance: 'db.r7g.large', quantity: 1 },
      s3: { gb: 1000, rate: 7.1 },
      ebs: { gb: 500, rate: 12 }
    }
  }
];

let baselineId = 'A';
let editing = null;

function priceFor(serviceKey, config) {
  const def = serviceDefs[serviceKey];
  if (def.instances) {
    return def.instances[config.instance].monthly * config.quantity;
  }
  if (serviceKey === 's3' || serviceKey === 'ebs') return config.gb * config.rate;
  return 0;
}

function totalFor(plan) {
  return Object.entries(plan.services).reduce((sum, [key, config]) => sum + priceFor(key, config), 0);
}

function deltaText(value, base) {
  const d = value - base;
  if (d === 0) return { text: '基準', cls: '' };
  return { text: `${d > 0 ? '+' : '−'}${yen.format(Math.abs(d))}`, cls: d > 0 ? 'up' : 'down' };
}

function render() {
  const grid = document.getElementById('comparisonGrid');
  grid.style.setProperty('--plan-count', plans.length);
  grid.innerHTML = '';

  const baseline = plans.find(p => p.id === baselineId) || plans[0];
  const baseTotal = totalFor(baseline);

  grid.appendChild(cell('grid-cell row-label header-cell', `
    <div class="eyebrow">PROJECT TOTAL</div>
    <div style="margin-top:10px;font-weight:750">複数案を同時比較</div>
    <div class="service-desc">セルから直接編集。変更は即時反映。</div>
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

  Object.keys(serviceDefs).forEach(serviceKey => {
    const def = serviceDefs[serviceKey];
    grid.appendChild(cell('grid-cell row-label', `
      <div class="service-row-label">
        <div class="service-icon">${def.icon}</div>
        <div><div class="service-name">${def.label}</div><div class="service-desc">${def.desc}</div></div>
      </div>
    `));

    plans.forEach(plan => {
      const config = plan.services[serviceKey];
      const p = priceFor(serviceKey, config);
      grid.appendChild(cell('grid-cell service-cell', `
        <div class="service-price">${yen.format(p)} <span class="muted" style="font-size:11px">/月</span></div>
        <div class="service-summary">${summaryLines(serviceKey, config)}</div>
        <div class="cell-actions"><button class="btn small" data-edit-plan="${plan.id}" data-edit-service="${serviceKey}">編集</button></div>
      `));
    });
  });

  grid.appendChild(cell('grid-cell total-label', `<strong>TOTAL</strong><div class="service-desc">常時表示する想定</div>`));
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
    return `
      <div class="summary-line">${c.instance} × ${c.quantity}</div>
      <div class="summary-line">${spec.vcpu} vCPU · ${spec.memory} GiB / instance</div>`;
  }
  return `<div class="summary-line">${c.gb.toLocaleString()} GB</div><div class="summary-line">${yen.format(c.rate)} / GB-month</div>`;
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
}

function duplicatePlan(id) {
  const source = plans.find(p => p.id === id);
  const newId = String.fromCharCode(65 + plans.length);
  plans.push({
    id: newId,
    name: `案${newId}`,
    note: `${source.name}のコピー`,
    services: JSON.parse(JSON.stringify(source.services))
  });
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
        <label>容量 (GB)</label>
        <input id="gbInput" type="number" min="0" step="10" value="${c.gb}" />
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
  const plan = plans.find(p => p.id === editing.planId);
  if (!plan) return;
  document.getElementById('drawerServicePrice').textContent = `${yen.format(priceFor(editing.serviceKey, plan.services[editing.serviceKey]))} /月`;
  document.getElementById('drawerPlanTotal').textContent = `${yen.format(totalFor(plan))} /月`;
}

function closeDrawer() {
  editing = null;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
}

document.getElementById('closeDrawer').onclick = closeDrawer;
document.getElementById('scrim').onclick = closeDrawer;
document.getElementById('recalcAll').onclick = () => {
  const btn = document.getElementById('recalcAll');
  const original = btn.textContent;
  btn.textContent = '✓ 再計算済み';
  setTimeout(() => btn.textContent = original, 900);
  render();
};
document.getElementById('addPlan').onclick = () => duplicatePlan(plans[plans.length - 1].id);
document.getElementById('addService').onclick = () => alert('モック: サービス追加Pickerを開く想定です。');

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
render();
