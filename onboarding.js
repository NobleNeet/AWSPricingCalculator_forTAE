// UI experiment: make the empty-project and service-entry flow explicit without
// changing the pricing mock underneath.
(() => {
  const deepCopy = value => JSON.parse(JSON.stringify(value));
  const initialDemoPlans = deepCopy(plans);
  const initialDemoRows = deepCopy(rows);
  const initialDemoRegion = projectRegion;
  const initialDemoBaseline = baselineId;

  const baseRender = render;
  const basePersistBrowserState = persistBrowserState;

  function isCanonicalDemo() {
    return plans.length === 3
      && plans[0]?.note === 'ベンダー原案'
      && plans[1]?.note === 'RDS→Aurora'
      && plans[2]?.note === 'サーバーレス寄り'
      && rows.some(row => row.id === 'compute')
      && rows.some(row => row.id === 'database');
  }

  function prepareRowsForComparison() {
    if (plans.length < 2) return;
    const allServices = Object.keys(serviceDefs);

    rows.forEach(row => {
      // Once there are multiple plans, every populated comparison row may use a
      // different AWS service in each plan. Keep the current service first so
      // "この行に追加" still defaults to the service already used in the row.
      const currentServices = plans
        .map(plan => row.cells[plan.id]?.service)
        .filter(Boolean);
      row.allowed = [...new Set([...currentServices, ...(row.allowed || []), ...allServices])];

      // Keep the row title descriptive rather than requiring a semantic role.
      const distinct = [...new Set(currentServices)];
      if (distinct.length) {
        row.label = distinct.map(key => serviceDefs[key]?.label || key).join(' / ');
      }
      if (distinct.length > 1) row.kind = 'linked';
    });
  }

  function renderEmptyProject() {
    const grid = document.getElementById('comparisonGrid');
    grid.style.removeProperty('--plan-count');
    grid.className = 'comparison-empty';
    grid.innerHTML = `
      <div class="empty-project-card">
        <div class="empty-project-icon">＋</div>
        <div>
          <div class="eyebrow dark">START ESTIMATE</div>
          <h2>構成案はまだありません</h2>
          <p>最初の構成案を作り、ベンダー提案などに書かれたAWSサービスを上から順に追加していきます。</p>
        </div>
        <div class="empty-project-actions">
          <button class="btn primary" id="createFirstPlan">＋ 最初の構成案を作る</button>
          <button class="btn ghost" id="loadDemoPlans">サンプル構成を見る</button>
        </div>
        <div class="empty-project-flow">
          <span><b>1</b>案を作る</span><i>→</i><span><b>2</b>サービスを追加</span><i>→</i><span><b>3</b>必要なら複製して比較</span>
        </div>
      </div>`;

    document.getElementById('createFirstPlan').onclick = () => {
      const id = 'A';
      plans = [{ id, name: '案A', note: '最初の構成案' }];
      rows = [];
      baselineId = id;
      render();
      setTimeout(() => openAddResourceModal(id), 0);
    };
    document.getElementById('loadDemoPlans').onclick = () => {
      plans = deepCopy(initialDemoPlans);
      rows = deepCopy(initialDemoRows);
      projectRegion = initialDemoRegion;
      baselineId = initialDemoBaseline;
      render();
    };

    const baselineSelect = document.getElementById('baselineSelect');
    baselineSelect.innerHTML = '<option>—</option>';
    baselineSelect.disabled = true;
    document.getElementById('addPlan').disabled = true;
    document.getElementById('autosaveStatus').textContent = '新規プロジェクト';
    localStorage.removeItem(STORAGE_KEY);
  }

  function renderServiceAddStrip() {
    const shell = document.querySelector('.comparison-shell');
    shell.querySelector('#serviceAddGrid')?.remove();
    if (!plans.length) return;

    const strip = document.createElement('div');
    strip.id = 'serviceAddGrid';
    strip.className = 'service-add-grid';
    strip.style.setProperty('--plan-count', plans.length);
    strip.innerHTML = `
      <div class="service-add-label">
        <strong>サービスを追加</strong>
        <span>新しい行として追加</span>
      </div>
      ${plans.map(plan => `
        <div class="service-add-cell">
          <button class="service-add-card" data-bottom-add-service="${plan.id}">
            <span class="plus">＋</span>
            <span><b>${plan.name} にサービスを追加</b><small>EC2 / RDS / S3 / Lambda ...</small></span>
          </button>
        </div>`).join('')}`;
    shell.appendChild(strip);
    strip.querySelectorAll('[data-bottom-add-service]').forEach(btn => {
      btn.onclick = () => openAddResourceModal(btn.dataset.bottomAddService);
    });
  }

  render = function () {
    if (!plans.length) {
      renderEmptyProject();
      return;
    }

    prepareRowsForComparison();

    const grid = document.getElementById('comparisonGrid');
    grid.className = 'comparison-grid';
    const baselineSelect = document.getElementById('baselineSelect');
    baselineSelect.disabled = false;
    document.getElementById('addPlan').disabled = false;
    baseRender();
    renderServiceAddStrip();

    // The bottom add cards are the primary entry point. Keep the header link as a
    // compact shortcut, but make the flow legible even when a plan has no services.
    if (!rows.length && plans.length === 1) {
      const first = document.querySelector('.service-add-card');
      first?.classList.add('recommended-action');
    }
  };

  persistBrowserState = function () {
    if (!plans.length) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    basePersistBrowserState();
  };

  // Selecting a service should immediately lead to its parameters instead of
  // silently accepting defaults.
  addResourceToPlan = function (planId, serviceKey) {
    const rowId = `${serviceKey}-${Date.now()}`;
    const cells = {};
    plans.forEach(p => { cells[p.id] = null; });
    cells[planId] = { service: serviceKey, config: serviceDefs[serviceKey].defaultConfig() };
    rows.push({ id: rowId, label: serviceDefs[serviceKey].label, kind: 'unique', allowed: [serviceKey], cells });
    closeAddResourceModal();
    render();
    setTimeout(() => openDrawer(planId, rowId, false), 0);
  };

  // Make a clean project available from the header so the zero-state can always
  // be tested, even after browser autosave has restored prior work.
  const headerActions = document.querySelector('.header-actions');
  const newProjectButton = document.createElement('button');
  newProjectButton.className = 'btn ghost';
  newProjectButton.id = 'newProject';
  newProjectButton.textContent = '新規プロジェクト';
  headerActions.prepend(newProjectButton);
  newProjectButton.onclick = () => {
    if (plans.length && !window.confirm('現在の画面を空の新規プロジェクトに切り替えますか？')) return;
    plans = [];
    rows = [];
    baselineId = '';
    editing = null;
    addingToPlanId = null;
    localStorage.removeItem(STORAGE_KEY);
    render();
  };

  // If this is the untouched built-in demo, show the real first-run experience.
  // Existing edited/autosaved work is preserved.
  if (isCanonicalDemo()) {
    plans = [];
    rows = [];
    baselineId = '';
  }
  render();
})();