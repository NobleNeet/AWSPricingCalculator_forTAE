import { PriceDataStore } from '../runtime/price-data-store.js';
import { DefinitionStore } from '../runtime/definition-store.js';
import { evaluateService, selectorCandidates } from '../pricing/core.js';
import { enabled } from '../pricing/conditions.js';
import { money } from '../pricing/decimal.js';
import { newProject, addPlan, duplicatePlan, deletePlan, placeService, removeService, planSummary, planDelta, createInstance, serializeProject } from './project-store.js';
import { restoreProject } from './restore.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const prices = new PriceDataStore();
export const definitions = new DefinitionStore();
export const results = new Map();
let state = newProject(), catalog = [], limitations = new Map(), target = null, editing = null;
let projectSchema;
const revisions = new Map();
const STORAGE_KEY = 'tae-project-v1';
function message(text) { $('app-message').textContent = text; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, serializeProject(state, { buildId: prices.buildId, publicationDate: prices.publicationDate })); }
  catch { message('自動保存できません。Project JSONを出力して保存してください。'); }
}
function rowLabel(row) {
  if (row.label) return row.label;
  return [...new Set(Object.values(row.cells).map(id => catalog.find(s => s.id === state.serviceInstances[id]?.serviceId)?.label ?? state.serviceInstances[id]?.serviceId))].join(' / ');
}
function stateText(result) {
  if (!result || result.state === 'loading') return '料金データ読込中…';
  if (result.state === 'unavailable') return 'Price Dataを取得できません。未計算';
  if (result.state === 'invalid') return result.issues?.map(item => item.message).join(' / ') || '安全に計算できません';
  return result.state === 'warning' ? 'Pricing Limitationあり' : '計算済み';
}
function render() {
  if (document.activeElement !== $('project-name')) $('project-name').value = state.project.name;
  if (document.activeElement !== $('project-region')) $('project-region').value = state.project.defaultRegion;
  if (document.activeElement !== $('project-hours')) $('project-hours').value = state.project.usageAssumptions.hoursPerMonth;
  const planIds = state.project.planOrder;
  if (!planIds.length) { $('workspace').innerHTML = '<div class="empty"><h2>構成案はまだありません</h2><p>空の構成案を作って、必要なサービスを追加しましょう。</p><button class="primary" data-action="add-plan">最初の構成案を作る</button></div>'; return; }
  const summaries = Object.fromEntries(planIds.map(id => [id, planSummary(state, id, results)]));
  const baseline = summaries[state.project.baselinePlanId];
  $('workspace').innerHTML = `<div class="workspace-toolbar"><span>${planIds.length} 構成案 · ${state.project.rowOrder.length} 比較行</span><button data-action="add-plan">空のPlanを追加</button></div><div class="comparison-scroll"><table><thead><tr><th>比較項目</th>${planIds.map(id => {
    const plan = state.plans[id];
    return `<th data-plan="${escape(id)}"><h2>${escape(plan.name)}</h2>${id === state.project.baselinePlanId ? '<span class="baseline-badge">Baseline</span>' : `<button data-action="baseline" data-plan="${escape(id)}">Baselineに設定</button>`}<div class="service-parameters">${escape(plan.memo)}</div><div class="plan-actions"><button data-action="rename-plan" data-plan="${escape(id)}">名称・メモ</button><button data-action="duplicate-plan" data-plan="${escape(id)}">Planを複製</button>${planIds.length > 1 ? `<button class="danger" data-action="delete-plan" data-plan="${escape(id)}">Planを削除</button>` : ''}</div><button data-action="add-service" data-plan="${escape(id)}">サービスを追加</button></th>`;
  }).join('')}</tr></thead><tbody>${state.project.rowOrder.map(rowId => {
    const row = state.rows[rowId];
    return `<tr data-row="${escape(rowId)}"><td class="row-label">${escape(rowLabel(row))}<div><button data-action="label-row" data-row="${escape(rowId)}">行名を編集</button></div></td>${planIds.map(planId => {
      const instance = state.serviceInstances[row.cells[planId]];
      if (!instance) return `<td>—<div class="cell-actions"><button data-action="add-service" data-plan="${escape(planId)}" data-row="${escape(rowId)}">この行に追加</button></div></td>`;
      const result = results.get(instance.id), amount = result?.amountUsd;
      const label = catalog.find(s => s.id === instance.serviceId)?.label ?? instance.serviceId;
      const params = [...Object.entries(instance.selectors ?? {}), ...Object.values(instance.components ?? {}).flatMap(c => Object.entries(c?.inputs ?? {}))].map(([key, value]) => `${key}: ${value}`).join(' · ');
      return `<td data-instance="${escape(instance.id)}"><div class="service-name">${escape(label)}</div><div class="service-parameters">${escape(params)}</div><div class="amount">${amount !== undefined && amount !== null ? escape(money(amount)) : '—'}</div><div class="state ${escape(result?.state)}">${escape(stateText(result))}</div>${result?.state === 'unavailable' ? `<button data-action="retry" data-instance="${escape(instance.id)}">再試行</button>` : ''}<div class="cell-actions"><button data-action="edit" data-instance="${escape(instance.id)}">編集</button><button data-action="add-service" data-plan="${escape(planId)}" data-row="${escape(rowId)}">別サービスへ置換</button><button class="danger" data-action="remove-service" data-plan="${escape(planId)}" data-row="${escape(rowId)}">Planから外す</button></div></td>`;
    }).join('')}</tr>`;
  }).join('')}<tr class="total"><td>月額 / 差額</td>${planIds.map(id => {
    const summary = summaries[id], delta = planDelta(summary, baseline);
    return `<td data-total="${escape(id)}"><div>${summary.complete ? '月額合計' : '計算済み小計'}</div><div class="amount">${escape(money(summary.amountUsd))}</div>${summary.uncalculated ? `<div class="invalid">未計算サービス: ${summary.uncalculated}</div>` : ''}<div class="delta">${delta !== null ? `Baselineとの差額: ${escape(money(delta))}` : '差額: 未計算項目があるため比較不可'}</div></td>`;
  }).join('')}</tr></tbody></table></div>`;
}
async function evaluate(id) {
  const instance = state.serviceInstances[id]; if (!instance) return;
  const revision = (revisions.get(id) ?? 0) + 1; revisions.set(id, revision);
  results.set(id, { state: 'loading', amountUsd: null }); render();
  let result;
  try {
    if (!catalog.some(service => service.id === instance.serviceId)) throw Object.assign(Error(`未知Service: ${instance.serviceId}`), { code: 'INVALID_DATA' });
    if (!['inherit', 'override'].includes(instance.region?.mode)) throw Object.assign(Error('Region設定が不正です。要再選択'), { code: 'INVALID_DATA' });
    const region = instance.region?.mode === 'override' ? instance.region.value : state.project.defaultRegion;
    const pkg = await definitions.package(instance.serviceId);
    const data = await prices.products(pkg.service.priceSource.serviceCode, region);
    result = evaluateService(pkg, instance, { ...state.project.usageAssumptions, defaultRegion: state.project.defaultRegion, region }, data.products);
  } catch (error) { result = { state: error.code === 'INVALID_DATA' ? 'invalid' : 'unavailable', amountUsd: null, issues: [{ code: error.code ?? 'FETCH_FAILED', severity: 'error', message: error.message }] }; }
  if (!state.serviceInstances[id] || revisions.get(id) !== revision) return;
  results.set(id, result); render();
  if (editing === id && $('service-drawer').open) await renderDrawer();
}
async function evaluateAll() { await Promise.all(Object.keys(state.serviceInstances).map(evaluate)); }
function field(input, scope, componentId, context, products, filters, inactive) {
  const values = scope === 'profile' ? context.profile : context.component;
  const value = values[input.id]; const active = !inactive && enabled(input.enabledWhen, context);
  const attrs = `data-scope="${scope}" data-field="${input.id}" ${componentId ? `data-component="${componentId}"` : ''} id="input-${scope}-${componentId ?? ''}-${input.id}" ${active ? '' : 'disabled'}`;
  let control;
  if (input.type === 'select') {
    const candidates = selectorCandidates(input, products, context, filters);
    control = `<select ${attrs}>${value === undefined || !candidates.includes(value) ? `<option value="" selected>要再選択${value === undefined ? '' : ` (${escape(value)})`}</option>` : ''}${candidates.map(option => `<option value="${escape(option)}" ${option === value ? 'selected' : ''}>${escape(option)}</option>`).join('')}</select>`;
  } else if (input.type === 'boolean') control = `<input type="checkbox" ${attrs} ${value ? 'checked' : ''}>`;
  else control = `<input type="number" min="${escape(input.minimum ?? '0')}" ${input.maximum !== undefined ? `max="${escape(input.maximum)}"` : ''} step="any" value="${escape(value)}" ${attrs}>`;
  return `<label>${escape(input.label)}${control}</label>${input.ui?.help ? `<div class="input-help">${escape(input.ui.help)}</div>` : ''}`;
}
async function renderDrawer() {
  const id = editing, instance = state.serviceInstances[id]; if (!instance) return;
  $('drawer-title').textContent = catalog.find(s => s.id === instance.serviceId)?.label ?? instance.serviceId;
  const focus = document.activeElement?.id;
  try {
    const pkg = await definitions.package(instance.serviceId), profile = pkg.profiles[instance.profileId];
    if (!profile) throw Error('未知Profile: 要再選択');
    const regionValid = ['inherit', 'override'].includes(instance.region?.mode);
    const region = instance.region?.mode === 'override' ? instance.region.value : state.project.defaultRegion;
    const data = await prices.products(pkg.service.priceSource.serviceCode, region);
    if (editing !== id) return;
    const context = { project: { ...state.project.usageAssumptions, region, defaultRegion: state.project.defaultRegion }, profile: instance.selectors, component: {} };
    const result = results.get(id);
    const renderProfileFields = advanced => profile.selectors.filter(input => Boolean(input.ui?.advanced) === advanced).map(input => field(input, 'profile', null, context, data.products, profile.fixedFilters, false)).join('');
    $('drawer-content').innerHTML = `<p class="state ${escape(result?.state)}">${escape(stateText(result))}</p><label>Profile<select id="drawer-profile">${pkg.service.profiles.map(profileId => `<option value="${profileId}" ${profileId === instance.profileId ? 'selected' : ''}>${escape(pkg.profiles[profileId].label)}</option>`).join('')}</select></label><label>Region<select id="drawer-region">${regionValid ? '' : '<option value="" selected>要再選択（不正なRegion設定）</option>'}<option value="inherit" ${instance.region?.mode === 'inherit' ? 'selected' : ''}>Project Regionを継承</option><option value="ap-northeast-1" ${instance.region?.mode === 'override' && region === 'ap-northeast-1' ? 'selected' : ''}>Tokyo override</option>${region !== 'ap-northeast-1' ? `<option value="${escape(region)}" selected>${escape(region)} override</option>` : ''}</select></label>${renderProfileFields(false)}${profile.selectors.some(input => input.ui?.advanced) ? `<details><summary>Advanced</summary>${renderProfileFields(true)}</details>` : ''}${profile.components.map(componentId => {
      const definition = pkg.components[componentId], saved = instance.components[componentId] ?? { inputs: {} };
      context.component = saved.inputs;
      const inactive = !enabled(definition.enabledWhen, context) || definition.optional && !saved.enabled;
      const filters = [...profile.fixedFilters, ...definition.fixedFilters, ...definition.priceQuery.productFilters.filter(f => !f.valueFrom?.startsWith('component.'))];
      const inputs = [...definition.selectors, ...definition.usageInputs];
      const renderFields = advanced => inputs.filter(input => Boolean(input.ui?.advanced) === advanced).map(input => field(input, 'component', componentId, context, data.products, filters, inactive)).join('');
      const component = result?.components?.[componentId];
      return `<fieldset><legend>${escape(definition.label)}</legend>${definition.optional ? `<label class="toggle-label"><input type="checkbox" data-toggle="${componentId}" ${saved.enabled ? 'checked' : ''}>Componentを有効にする</label>` : ''}${inactive ? '<p class="notice-text">無効中（値は保持され、計算から除外されます）</p>' : ''}${renderFields(false)}${inputs.some(input => input.ui?.advanced) ? `<details><summary>Advanced</summary>${renderFields(true)}</details>` : ''}<div class="component-price">${component?.amountUsd !== undefined ? escape(money(component.amountUsd)) : inactive ? '—' : '未計算'}</div>${component?.issues?.map(i => `<p class="invalid">${escape(i.message)}</p>`).join('') ?? ''}</fieldset>`;
    }).join('')}<h3>Pricing Limitation</h3>${[...new Set(Object.values(result?.components ?? {}).flatMap(c => c.limitations ?? []))].map(id => {
      const limitation = limitations.get(id); return `<p class="${limitation?.severity === 'warning' ? 'warning-text' : 'notice-text'}">${escape(limitation?.message ?? id)}</p>`;
    }).join('')}`;
    if (focus?.startsWith('input-')) $(focus)?.focus();
  } catch (error) {
    $('drawer-content').innerHTML = `<p class="invalid">${escape(error.message)}</p><p>構成は保存できます。Service置換または再試行で編集を継続してください。</p><button data-drawer-retry>再試行</button>`;
  }
}
function renderCatalog() {
  const search = $('catalog-search').value.toLowerCase(), filter = $('catalog-filter').value;
  $('catalog-list').innerHTML = catalog.filter(s => s.label.toLowerCase().includes(search) && (!filter || s.serviceCode === filter)).map(service => `<button data-service="${service.id}" ${service.available ? '' : 'disabled'}>${escape(service.label)}<small>${service.available ? `${escape(state.project.defaultRegion)} · AWS Public Price List` : 'DefinitionまたはPrice Dataが利用できません'}</small></button>`).join('') || '<p>該当するサービスはありません。</p>';
}
function openCatalog(planId, rowId) {
  target = { planId, rowId }; $('catalog-target').textContent = `${state.plans[planId].name} · ${rowId ? state.rows[rowId].cells[planId] ? '同じ行のサービスを置換' : '既存の比較行へ追加' : '新しい比較行へ追加'}`;
  $('catalog-search').value = ''; renderCatalog(); $('catalog-modal').showModal();
}
document.addEventListener('click', event => { const button = event.target.closest('[data-close]'); if (button) $(button.dataset.close).close(); });
$('workspace').addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const { action, plan, row, instance } = button.dataset;
  if (action === 'add-plan') addPlan(state);
  if (action === 'duplicate-plan') { duplicatePlan(state, plan); await evaluateAll(); }
  if (action === 'delete-plan') deletePlan(state, plan);
  if (action === 'baseline') state.project.baselinePlanId = plan;
  if (action === 'rename-plan') { const name = prompt('Plan名', state.plans[plan].name); if (name !== null) state.plans[plan].name = name; const memo = prompt('Planメモ', state.plans[plan].memo); if (memo !== null) state.plans[plan].memo = memo; }
  if (action === 'label-row') { const label = prompt('比較行名（空欄で自動生成）', state.rows[row].label ?? ''); if (label !== null) state.rows[row].label = label || null; }
  if (action === 'add-service') { openCatalog(plan, row); return; }
  if (action === 'remove-service') { if (editing === state.rows[row]?.cells[plan]) { $('service-drawer').close(); editing = null; } removeService(state, plan, row); }
  if (action === 'edit') { editing = instance; $('service-drawer').showModal(); await renderDrawer(); return; }
  if (action === 'retry') { await evaluate(instance); return; }
  save(); render();
});
$('catalog-search').addEventListener('input', renderCatalog); $('catalog-filter').addEventListener('change', renderCatalog);
$('catalog-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-service]'); if (!button) return;
  const selectedTarget = target, selectedProject = state;
  button.disabled = true;
  try {
    const pkg = await definitions.package(button.dataset.service), instance = createInstance(pkg);
    if (target !== selectedTarget || state !== selectedProject || !$('catalog-modal').open) return;
    placeService(state, selectedTarget.planId, instance, selectedTarget.rowId); save(); $('catalog-modal').close(); editing = instance.id; $('service-drawer').showModal();
    await evaluate(instance.id); await renderDrawer();
  } catch (error) { message(error.message); button.disabled = false; }
});
$('catalog-modal').addEventListener('close', () => { target = null; });
$('service-drawer').addEventListener('close', () => { editing = null; });
$('drawer-content').addEventListener('change', async event => {
  const input = event.target, instance = state.serviceInstances[editing]; if (!instance) return;
  if (input.dataset.field) {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    if (input.dataset.scope === 'profile') instance.selectors[input.dataset.field] = value;
    else (instance.components[input.dataset.component] ??= { enabled: true, inputs: {} }).inputs[input.dataset.field] = value;
  } else if (input.dataset.toggle) instance.components[input.dataset.toggle].enabled = input.checked;
  else if (input.id === 'drawer-region') instance.region = input.value === 'inherit' ? { mode: 'inherit' } : { mode: 'override', value: input.value };
  else if (input.id === 'drawer-profile') { const pkg = await definitions.package(instance.serviceId); const fresh = createInstance(pkg, input.value); instance.profileId = input.value; instance.selectors = { ...fresh.selectors, ...instance.selectors }; instance.components = { ...fresh.components, ...instance.components }; }
  else return;
  save(); await evaluate(editing);
});
$('drawer-content').addEventListener('click', event => { if (event.target.closest('[data-drawer-retry]')) evaluate(editing); });
$('project-name').addEventListener('change', event => { state.project.name = event.target.value; save(); });
$('project-hours').addEventListener('change', async event => { state.project.usageAssumptions.hoursPerMonth = event.target.value; save(); await evaluateAll(); });
$('project-region').addEventListener('change', async event => { state.project.defaultRegion = event.target.value; save(); await evaluateAll(); renderCatalog(); });
$('new-project').addEventListener('click', () => { if (!state.project.planOrder.length || confirm('現在のProjectを新規Projectに切り替えますか？')) { state = newProject(); results.clear(); editing = null; $('service-drawer').close(); save(); render(); } });
export function downloadText(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function projectJson() { return serializeProject(state, { buildId: prices.buildId, publicationDate: prices.publicationDate }); }
$('json-export').addEventListener('click', () => downloadText('aws-project.json', projectJson()));
$('restore-open').addEventListener('click', () => $('restore-modal').showModal());
$('restore-submit').addEventListener('click', async () => {
  const text = $('restore-text').value;
  const packages = new Map();
  try {
    const parsed = JSON.parse(text);
    await Promise.all([...new Set(Object.values(parsed.serviceInstances ?? {}).map(instance => instance?.serviceId).filter(Boolean))].map(async id => { try { packages.set(id, await definitions.package(id)); } catch { /* Partial restoration remains possible. */ } }));
  } catch { /* The pure restore parser reports fatal errors. */ }
  const report = restoreProject(text, { schema: projectSchema, packages, currentBuildId: prices.buildId });
  $('restore-report').textContent = `${report.fatal ? '復元失敗（現在のProjectは変更されません）' : '復元完了'}\n${report.issues.map(item => `${item.code}: ${item.message}`).join('\n')}`;
  if (!report.fatal) await replaceProject(report.project);
});
for (const kind of ['csv', 'pdf']) $(`${kind}-export`).addEventListener('click', async () => {
  try { const exports = await import('./export.js'); await exports.exportProject(kind, { state, results, catalog, definitions, limitations, prices, json: projectJson(), download: downloadText }); }
  catch (error) { message(`出力エラー: ${error.message}`); }
});
export async function replaceProject(next) { state = next; results.clear(); editing = null; $('service-drawer').close(); save(); render(); await evaluateAll(); }
export const appState = () => state;
function renderMetadata() { $('price-meta').textContent = prices.publicationDate ? `Price Data ${prices.publicationDate} · ${prices.buildId}${prices.stale ? ' · stale（新buildまたは最新確認失敗。使用中buildで計算）' : ''}` : 'Price Dataを取得できません（Project編集・保存は継続できます）'; }
$('check-price').addEventListener('click', async () => { await prices.initialize().catch(() => {}); await prices.checkLatest(); renderMetadata(); await evaluateAll(); });
async function initialize() {
  try { const response = await fetch('./schemas/project.schema.json'); if (!response.ok) throw Error('Schema fetch failure'); projectSchema = await response.json(); }
  catch { message('Project Schemaを取得できません。復元を利用するには再読込してください。'); $('restore-submit').disabled = true; }
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('awsPricingCalculator.project.v1');
    if (saved) {
      const report = restoreProject(saved, { schema: projectSchema });
      if (!report.fatal) { state = report.project; if (report.issues.length) message(report.issues.map(item => item.message).join(' / ')); }
      else message('保存Projectを安全に復元できません。保存データは保持して新規Projectを表示します。');
    }
  } catch { message('保存Projectを読み込めません。新規Projectを表示します。'); }
  render();
  const tasks = await Promise.allSettled([definitions.catalog(), prices.initialize(), fetch('./pricing/limitations.json').then(response => response.json())]);
  if (tasks[0].status === 'fulfilled') catalog = tasks[0].value.services;
  else message('Service Catalogを読み込めません。再読込で再試行してください。');
  if (tasks[2].status === 'fulfilled') limitations = new Map(tasks[2].value.limitations.map(item => [item.id, item]));
  if (tasks[1].status === 'fulfilled') catalog = catalog.map(service => ({ ...service, available: service.available && !!tasks[1].value.sources[service.serviceCode]?.[state.project.defaultRegion] }));
  $('catalog-filter').innerHTML = '<option value="">すべて</option>' + [...new Set(catalog.map(service => service.serviceCode))].map(code => `<option>${escape(code)}</option>`).join('');
  renderMetadata(); render(); await evaluateAll();
}
await initialize();