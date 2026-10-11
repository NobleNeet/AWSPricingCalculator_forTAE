import { test, expect } from '@playwright/test';
import { readJson } from '../../tools/pricing-cli/package-loader.js';
import { verifyRawPrice } from '../../tools/pricing-cli/golden.js';
import { money } from '../../src/pricing/decimal.js';

const schedulerGolden = await readJson('services/eventbridge/golden/tokyo.json');
const eventPrices = await readJson('tests/fixtures/aws/AWSEvents.json');
const schedulerAmount = quantity => money(verifyRawPrice(eventPrices, { ...schedulerGolden.verification.scheduler, quantity }).amountUsd);

async function start(page) { await page.goto('./'); await expect(page.locator('#price-meta')).toContainText(/Price Data \d{4}-\d{2}-\d{2}/); await page.getByRole('button', { name:'最初の構成案を作る' }).click(); }
async function add(page, service) { await page.getByRole('button', { name:'サービスを追加',exact:true }).click(); await page.locator(`[data-service="${service}"]`).click(); }
async function set(page, selector, value) { const input=page.locator(selector); await input.waitFor({state:'attached'}); const details=input.locator('xpath=ancestor::details'); if(await details.count() && !await input.isVisible()) await details.locator('summary').click(); await input.fill(value); await input.press('Tab'); }
async function close(page) { await page.getByLabel('編集を閉じる').click(); }

test('S3 Plan tiers recompute both rows when a row is removed', async ({page}) => {
  await start(page); await add(page,'s3'); await set(page,'#input-component-storage-gbMonths','30000'); await set(page,'#input-component-write-requests-requests','0'); await set(page,'#input-component-read-requests-requests','0'); await close(page);
  await add(page,'s3'); await set(page,'#input-component-storage-gbMonths','30000'); await set(page,'#input-component-write-requests-requests','0'); await set(page,'#input-component-read-requests-requests','0'); await close(page);
  await expect(page.locator('[data-total] .amount')).toHaveText('$1491.20');
  await page.locator('td[data-instance]').first().getByRole('button',{name:'Planから外す'}).click();
  await expect(page.locator('[data-total] .amount')).toHaveText('$750.00');
});

test('Dedicated regional fees fail closed on duplicates and recover after disabling one fee', async ({page}) => {
  await start(page); await add(page,'ec2'); await page.locator('#input-profile--tenancy').selectOption('Dedicated');
  await set(page,'#input-component-dedicated-region-fee-hours','100'); await close(page);
  await add(page,'ec2'); await page.locator('#input-profile--tenancy').selectOption('Dedicated');
  await expect(page.locator('#workspace')).toContainText('地域料金が重複');
  await page.locator('[data-toggle="dedicated-region-fee"]').uncheck(); await close(page);
  await expect(page.locator('td[data-instance] .amount').first()).toHaveText(/^\$/);
  await expect(page.locator('td[data-instance] .amount').last()).toHaveText(/^\$/);
  await expect(page.locator('[data-total] .amount')).toHaveText(/^\$/);
  await expect(page.locator('[data-total]')).toContainText('月額合計');
  await expect(page.locator('#workspace')).not.toContainText('地域料金が重複');
});

test('Scheduler shares one allowance across rows and shows the gross quote', async ({page}) => {
  await start(page); await add(page,'eventbridge');
  await set(page,'#input-profile--schedulerInvocationsMillions','10'); await close(page);
  await add(page,'eventbridge'); await set(page,'#input-profile--schedulerInvocationsMillions','10'); await close(page);
  await expect(page.locator('td[data-instance]').first()).toContainText('控除前');
  await expect(page.locator('td[data-instance] .amount').first()).toHaveText('$0.00');
  await expect(page.locator('td[data-instance] .amount').last()).toHaveText(schedulerAmount('6000000'));
  await set(page,'#scheduler-free-remaining','0');
  await expect(page.locator('[data-total] .amount')).toHaveText(schedulerAmount('20000000'));
  await set(page,'#scheduler-free-remaining','14000001');
  await expect(page.locator('#workspace')).toContainText('残り無料枠');
  await expect(page.locator('td[data-instance] .amount').first()).toHaveText('—');
});
