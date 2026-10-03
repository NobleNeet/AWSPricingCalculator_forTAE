import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { newProject, addPlan, createInstance, placeService } from '../../src/app/project-store.js';
import { restoreProject } from '../../src/app/restore.js';
import { exportRows, csv, pdfLines, createPdf } from '../../src/app/export.js';
import { readJson, loadPackage } from '../../tools/pricing-cli/package-loader.js';

test('restore fatal, partial unknown data, independent configurations and new price build audit', async () => {
  const schema = await readJson('schemas/project.schema.json'), pkg = await loadPackage('services/ec2');
  const state = newProject(), plan = addPlan(state), instance = createInstance(pkg); placeService(state, plan, instance);
  const options = { schema, packages: new Map([['ec2', pkg]]), currentBuildId: 'current-build' };
  assert.equal(restoreProject('{', options).fatal, true);
  assert.equal(restoreProject(JSON.stringify({ ...state, schemaVersion: 99 }), options).fatal, true);
  const bad = structuredClone(state); bad.rows[bad.project.rowOrder[0]].cells[plan] = 'missing';
  assert.equal(restoreProject(JSON.stringify(bad), options).fatal, true);
  state.priceData = { buildId: 'older-build' }; instance.selectors.futureField = { nested: 'preserved' }; instance.components.future = { enabled: false, inputs: { future: 'x' } };
  const report = restoreProject(JSON.stringify(state), options);
  assert.equal(report.fatal, false); assert.ok(report.issues.some(i => i.code === 'PRICE_BUILD_CHANGED'));
  assert.deepEqual(report.project.serviceInstances[instance.id].selectors.futureField, { nested: 'preserved' });
  instance.serviceId = 'future-service';
  const partial = restoreProject(JSON.stringify(state), options); assert.equal(partial.fatal, false); assert.ok(partial.issues.some(i => i.code === 'UNKNOWN_SERVICE'));
  assert.equal(state.serviceInstances[instance.id].serviceId, 'future-service');
});
test('explicit migration, no path rejection and legacy mock values preserved without pricing guess', async () => {
  const schema = await readJson('schemas/project.schema.json');
  const old = newProject(); old.schemaVersion = 0;
  assert.equal(restoreProject(JSON.stringify(old), { schema }).fatal, true);
  assert.equal(restoreProject(JSON.stringify(old), { schema, migrations: new Map([[0, value => ({ ...value, schemaVersion: 1 })]]) }).fatal, false);
  const legacy = { schemaVersion: 1, project: { name: 'Old', defaultRegion: 'ap-northeast-1' }, plans: [{ id: 'p', name: 'A' }], rows: [{ id: 'r', cells: { p: { service: 'ec2', instanceType: 'm7i.large', mockPrice: 12 } } }] };
  const restored = restoreProject(JSON.stringify(legacy), { schema }); assert.equal(restored.fatal, false);
  const instance = Object.values(restored.project.serviceInstances)[0]; assert.equal(instance.serviceId, 'legacy-ec2'); assert.equal(instance.legacyInput.instanceType, 'm7i.large');
});
test('CSV and Japanese PDF include exact prices, risks, subtotal and all limitations', async () => {
  const state = newProject(), plan = addPlan(state, '=untrusted'), pkg = await loadPackage('services/ec2'), instance = createInstance(pkg); placeService(state, plan, instance);
  const results = new Map([[instance.id, { state: 'warning', amountUsd: '9.928', components: { instance: { amountUsd: '9.928', state: 'warning', limitations: ['network-transfer'] } } }]]);
  const registry = await readJson('pricing/limitations.json');
  const context = { state, results, catalog: [{ id: 'ec2', label: 'Amazon EC2' }], limitations: new Map(registry.limitations.map(i => [i.id, i])), packages: new Map([['ec2', pkg]]), prices: { buildId: 'build', publicationDate: '2026-10-01' } };
  const rows = exportRows(context); assert.equal(rows[0].raw_monthly_usd, '9.928'); assert.equal(rows[0].has_underestimate_risk, true);
  assert.match(csv(rows), /'\=untrusted/); assert.match(csv(rows), /9.928/);
  const unknown = { id: 'unknown', serviceId: 'future', profileId: 'x', selectors: {}, components: {} }; placeService(state, plan, unknown); results.set('unknown', { state: 'unavailable', amountUsd: null });
  const lines = pdfLines(context, exportRows(context)); assert.ok(lines.some(line => line.includes('計算済み小計'))); assert.ok(lines.some(line => line.includes('network-transfer')));
  const bytes = await createPdf(lines, { pdfLib: { PDFDocument }, fontkit, fontBytes: await readFile('vendor/fonts/NotoSansCJKjp-Regular.otf') });
  const pdf = await PDFDocument.load(bytes); assert.ok(pdf.getPageCount() >= 1); assert.equal(pdf.getTitle(), state.project.name);
});
