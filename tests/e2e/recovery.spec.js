import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { activeBuildId, expected } from './expected-prices.js';

async function start(page) { await page.goto('./'); await expect(page.locator('#price-meta')).toContainText(activeBuildId); await page.getByRole('button', { name: '最初の構成案を作る' }).click(); }
async function add(page, service) { await page.getByRole('button', { name: 'サービスを追加', exact: true }).click(); await page.locator(`[data-service="${service}"]`).click(); }
test('slow loading has no price, per-source unavailable yields subtotal, retry recovers', async ({ page }) => {
  const pattern = '**/sources/AmazonEC2/**/products.json'; let release;
  const gate = new Promise(resolve => release = resolve);
  await page.route(pattern, async route => { await gate; await route.abort(); });
  await start(page); await add(page, 'ec2');
  await expect(page.locator('td[data-instance]')).toContainText('料金データ読込中');
  await expect(page.locator('td[data-instance] .amount')).toHaveText('—'); release();
  await expect(page.locator('td[data-instance]')).toContainText('未計算'); await page.getByLabel('編集を閉じる').click();
  await add(page, 's3'); await expect(page.locator('#workspace')).toContainText(expected.s3.display); await page.getByLabel('編集を閉じる').click();
  await expect(page.locator('[data-total]')).toContainText('計算済み小計'); await expect(page.locator('[data-total]')).toContainText('未計算サービス: 1');
  const csvPromise = page.waitForEvent('download'); await page.locator('#csv-export').click();
  const csvDownload = await csvPromise; expect(await readFile(await csvDownload.path(), 'utf8')).toContain('unavailable');
  await page.unroute(pattern); await page.locator('td[data-instance]').first().getByRole('button', { name: '再試行', exact: true }).click();
  await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await expect(page.locator('[data-total]')).toContainText('月額合計');
});
test('dependent selector remains invalid until explicit reselection; optional component retains input', async ({ page }) => {
  await start(page); await add(page, 'ec2');
  await page.locator('#input-component-instance-instanceType').selectOption('a1.medium');
  await page.locator('#input-profile--os').selectOption('Windows');
  await expect(page.locator('#workspace')).toContainText('要再選択'); await expect(page.locator('#input-component-instance-instanceType')).toHaveValue('');
  await page.locator('#input-component-instance-instanceType').selectOption('t3.micro'); await page.getByLabel('編集を閉じる').click();
  await add(page, 'rds'); await page.locator('#input-component-storage-gbMonths').fill('100'); await page.locator('#input-component-storage-gbMonths').press('Tab');
  await page.getByLabel('Componentを有効にする').uncheck(); await expect(page.locator('#input-component-storage-gbMonths')).toBeDisabled();
  await expect(page.locator('#input-component-storage-gbMonths')).toHaveValue('100');
  await page.getByLabel('Componentを有効にする').check(); await expect(page.locator('#input-component-storage-gbMonths')).toBeEnabled(); await expect(page.locator('#input-component-storage-gbMonths')).toHaveValue('100');
});
test('stale check keeps pinned build and cached valid prices, products fetch deduplicates', async ({ page }) => {
  let requests = 0; await page.route('**/sources/AmazonEC2/**/products.json', route => { requests++; return route.continue(); });
  await start(page); await add(page, 'ec2'); await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await page.getByLabel('編集を閉じる').click();
  await page.getByRole('button', { name: 'Planを複製', exact: true }).click(); await expect(page.locator('td[data-instance]')).toHaveCount(2); expect(requests).toBe(1);
  await page.route('**/pricing/generated/manifest.json', route => route.fulfill({ json: { schemaVersion: 1, activeBuildId: 'future-build', publicationDate: 'future' } }));
  await page.locator('#check-price').click(); await expect(page.locator('#price-meta')).toContainText('stale'); await expect(page.locator('#price-meta')).toContainText(activeBuildId);
  await expect(page.locator('td[data-instance]').first()).toContainText(expected.ec2.display); expect(requests).toBe(1);
  await page.unroute('**/pricing/generated/manifest.json'); await page.route('**/pricing/generated/manifest.json', route => route.abort()); await page.locator('#check-price').click();
  await expect(page.locator('#price-meta')).toContainText('stale'); await expect(page.locator('td[data-instance]').last()).toContainText(expected.ec2.display);
});
test('unknown Service/fields partial restore preserve JSON and known Service, catalog search cancellation', async ({ page }) => {
  await start(page); await add(page, 'ec2'); await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await page.getByLabel('編集を閉じる').click();
  const downloadPromise = page.waitForEvent('download'); await page.locator('#json-export').click(); const first = await downloadPromise;
  const project = JSON.parse(await readFile(await first.path(), 'utf8')), planId = project.project.planOrder[0];
  project.project.rowOrder.push('future-row'); project.rows['future-row'] = { id: 'future-row', label: 'Future configuration', cells: { [planId]: 'future-instance' } };
  project.serviceInstances['future-instance'] = { id: 'future-instance', serviceId: 'future-service', profileId: 'future', region: { mode: 'inherit' }, selectors: { future: { arbitrary: ['preserved'] } }, components: {} };
  Object.values(project.serviceInstances)[0].components.future = { enabled: false, inputs: { future: 'preserved' } };
  await page.locator('#restore-open').click(); await page.locator('#restore-text').fill(JSON.stringify(project)); await page.locator('#restore-submit').click();
  await expect(page.locator('#restore-report')).toContainText('UNKNOWN_SERVICE'); await page.getByLabel('復元を閉じる').click();
  await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await expect(page.locator('#workspace')).toContainText('未計算サービス: 1');
  const nextPromise = page.waitForEvent('download'); await page.locator('#json-export').click(); const next = await nextPromise;
  const restored = JSON.parse(await readFile(await next.path(), 'utf8')); expect(restored.serviceInstances['future-instance'].selectors.future.arbitrary).toEqual(['preserved']);
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click(); await page.locator('#catalog-search').fill('lambda');
  await expect(page.locator('#catalog-list [data-service]')).toHaveCount(1); await page.getByLabel('サービス選択を閉じる').click();
  await expect(page.locator('td[data-instance]')).toHaveCount(2);
});
test('restore escapes opaque stable IDs and invalid Region requires explicit repair', async ({ page }) => {
  await start(page); await add(page, 'ec2'); await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await page.getByLabel('編集を閉じる').click();
  const exported = page.waitForEvent('download'); await page.locator('#json-export').click(); const download = await exported;
  const state = JSON.parse(await readFile(await download.path(), 'utf8')), oldId = state.project.planOrder[0];
  const id = 'plan"><img src=x onerror="alert(1)">';
  state.plans[id] = { ...state.plans[oldId], id }; delete state.plans[oldId]; state.project.planOrder = [id]; state.project.baselinePlanId = id;
  for (const row of Object.values(state.rows)) { row.cells[id] = row.cells[oldId]; delete row.cells[oldId]; }
  Object.values(state.serviceInstances)[0].region = { mode: 'unknown' };
  await page.locator('#restore-open').click(); await page.locator('#restore-text').fill(JSON.stringify(state)); await page.locator('#restore-submit').click(); await page.getByLabel('復元を閉じる').click();
  await expect(page.locator('#workspace img')).toHaveCount(0); await expect(page.locator('#workspace')).toContainText('Region設定が不正');
  await expect(page.locator('td[data-instance] .amount')).toHaveText('—'); await page.getByRole('button', { name: '編集', exact: true }).click();
  await expect(page.locator('#drawer-region')).toHaveValue(''); await page.locator('#drawer-region').selectOption('inherit');
  await expect(page.locator('#workspace')).toContainText(expected.ec2.display); await page.getByLabel('編集を閉じる').click();
  await page.getByRole('button', { name: 'Planを複製', exact: true }).click(); await expect(page.locator('thead th[data-plan]')).toHaveCount(2);
});
