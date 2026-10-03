import { money } from '../pricing/decimal.js';
import { planSummary, planDelta } from './project-store.js';

export function exportRows({ state, results, catalog, limitations, packages = new Map(), prices }) {
  const rows = [];
  for (const planId of state.project.planOrder) for (const rowId of state.project.rowOrder) {
    const row = state.rows[rowId], instance = state.serviceInstances[row.cells[planId]]; if (!instance) continue;
    const result = results.get(instance.id), pkg = packages.get(instance.serviceId);
    const label = catalog.find(service => service.id === instance.serviceId)?.label ?? instance.serviceId;
    const componentIds = Object.keys(result?.components ?? {});
    for (const componentId of componentIds.length ? componentIds : ['']) {
      const component = result?.components?.[componentId], definition = pkg?.components?.[componentId];
      const limitationIds = component?.limitations ?? (component?.state === 'disabled' ? [] : definition?.limitations ?? []);
      const amount = component?.amountUsd;
      rows.push({ planId, plan: state.plans[planId].name, row: row.label ?? label, service: label, component: definition?.label ?? componentId, raw_monthly_usd: amount ?? '', display_monthly_usd: amount !== undefined && amount !== null ? money(amount) : '', service_monthly_usd: result?.amountUsd ?? '', state: component?.state ?? result?.state ?? 'loading', limitation_ids: limitationIds.join(';'), has_underestimate_risk: limitationIds.some(id => limitations.get(id)?.severity === 'warning'), selectors: JSON.stringify(instance.selectors ?? {}), usage: JSON.stringify(instance.components?.[componentId]?.inputs ?? {}), region: instance.region?.mode === 'override' ? instance.region.value : state.project.defaultRegion, publication_date: prices.publicationDate ?? '', build_id: prices.buildId ?? '' });
    }
  }
  return rows;
}
export function csv(rows) {
  const columns = ['plan', 'row', 'service', 'component', 'raw_monthly_usd', 'display_monthly_usd', 'service_monthly_usd', 'state', 'limitation_ids', 'has_underestimate_risk', 'selectors', 'usage', 'region', 'publication_date', 'build_id'];
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return '\uFEFF' + [columns.map(cell).join(','), ...rows.map(row => columns.map(column => cell(row[column])).join(','))].join('\r\n') + '\r\n';
}
export function pdfLines(context, rows) {
  const { state, results, prices, limitations } = context;
  const lines = [state.project.name, 'AWS構成・料金比較 / 月額概算', `Price Data: ${prices.publicationDate ?? 'unavailable'} / build ${prices.buildId ?? 'unavailable'}`, `USD / On-Demand / 税別 / Region ${state.project.defaultRegion}`, 'Free Tier・無料枠・RI・Savings Plans・Spot・割引は対象外', `作成日時: ${new Date().toISOString()}`, ''];
  const baseline = planSummary(state, state.project.baselinePlanId, results);
  for (const planId of state.project.planOrder) {
    const plan = state.plans[planId], summary = planSummary(state, planId, results), delta = planDelta(summary, baseline);
    lines.push(`Plan: ${plan.name}${planId === state.project.baselinePlanId ? ' [Baseline]' : ''}`, `メモ: ${plan.memo}`, `${summary.complete ? '月額合計' : '計算済み小計'}: ${money(summary.amountUsd)} / 未計算サービス: ${summary.uncalculated}`, `Baseline差額: ${delta === null ? '未計算のため比較不可' : money(delta)}`);
    let previous = '';
    for (const row of rows.filter(row => row.planId === planId)) {
      const key = `${row.row}/${row.service}`;
      if (key !== previous) { lines.push(`  ${row.row} / ${row.service} / Region ${row.region}`, `  selector: ${row.selectors}`, `  Service月額: ${row.service_monthly_usd ? money(row.service_monthly_usd) : '未計算'}`); previous = key; }
      lines.push(`    ${row.component}: ${row.display_monthly_usd || '未計算/無効'} (${row.state})`, `    入力: ${row.usage}`);
    }
    lines.push('');
  }
  lines.push('Pricing Limitation');
  const ids = new Set(rows.flatMap(row => row.limitation_ids.split(';').filter(Boolean)));
  for (const id of ids) { const item = limitations.get(id); lines.push(`${item?.severity === 'warning' ? 'WARNING / 過小見積の可能性' : 'NOTICE'} [${id}] ${item?.message ?? id}`); }
  if (rows.some(row => ['unavailable', 'invalid', 'loading'].includes(row.state))) lines.push('未計算項目を含みます。この小計は完全なPlan合計ではありません。');
  return lines;
}
export async function createPdf(lines, { pdfLib, fontkit, fontBytes }) {
  const document = await pdfLib.PDFDocument.create(); document.registerFontkit(fontkit);
  const font = await document.embedFont(fontBytes, { subset: true });
  document.setTitle(lines[0]); document.setProducer('AWSPricingCalculator_forTAE');
  let page, y, pageNumber = 0;
  const newPage = () => { page = document.addPage([595.28, 841.89]); y = 790; pageNumber++; page.drawText(String(pageNumber), { x: 550, y: 24, size: 9, font }); };
  newPage();
  for (const original of lines) {
    const text = String(original).replace(/[\u0000-\u001f\u007f]/g, ' ');
    let line = '';
    const draw = value => { if (y < 55) newPage(); page.drawText(value, { x: 40, y, size: 10, font }); y -= 17; };
    for (const character of text) {
      if (line && font.widthOfTextAtSize(line + character, 10) > 515) { draw(line); line = character; } else line += character;
    }
    draw(line);
  }
  return document.save();
}
export async function exportProject(kind, original) {
  const context = { ...original, state: structuredClone(original.state), results: new Map([...original.results].map(([id, result]) => [id, structuredClone(result)])), packages: new Map() };
  await Promise.all([...new Set(Object.values(context.state.serviceInstances).map(instance => instance.serviceId))].map(async id => { try { context.packages.set(id, await context.definitions.package(id)); } catch { /* Failed resources remain exportable as uncalculated. */ } }));
  const rows = exportRows(context);
  if (kind === 'csv') { context.download('aws-comparison.csv', csv(rows), 'text/csv;charset=utf-8'); return; }
  if (kind !== 'pdf') throw Error('Unknown export kind');
  const [pdfLib, , response] = await Promise.all([import('../../vendor/pdf-lib.esm.js'), import('../../vendor/fontkit.umd.min.js'), fetch('./vendor/fonts/NotoSansCJKjp-Regular.otf')]);
  if (!response.ok) throw Error('PDF用日本語フォントを取得できません');
  const bytes = await createPdf(pdfLines(context, rows), { pdfLib, fontkit: globalThis.fontkit, fontBytes: await response.arrayBuffer() });
  context.download('aws-comparison.pdf', bytes, 'application/pdf');
  context.download('aws-project.json', context.json);
}
