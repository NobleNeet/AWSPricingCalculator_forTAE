import { test, expect } from '@playwright/test';
import { activeBuildId } from './expected-prices.js';

test('RDS for Oracle exposes all supported Calculator inputs and the PostgreSQL-style instance picker', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('./');
  await expect(page.locator('#price-meta')).toContainText(activeBuildId);
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="rds-oracle"]').click();
  await expect(page.locator('#service-drawer')).toBeVisible();
  console.log('ORACLE_DRAWER_DEBUG', (await page.locator('#drawer-content').innerText()).slice(0,2000));
  try { await expect(page.locator('[data-instance-picker="rds-oracle"]')).toBeVisible(); }
  catch (error) { console.log('ORACLE_DRAWER_FINAL', (await page.locator('#drawer-content').innerHTML()).slice(0,6500)); console.log('ORACLE_ELEMENTS', await page.locator('#input-component-instance-instanceType').count()); throw error; }
  await expect(page.locator('[data-instance-filter="memory"]')).toBeVisible();
  await expect(page.locator('.ec2-drawer-resizer')).toBeAttached();
  await expect(page.locator('[data-instance-drawer-width]')).toBeVisible();
  await expect(page.locator('#input-profile--nodes')).toHaveValue('1');
  await expect(page.locator('#input-profile--utilizationPct')).toHaveValue('100');
  await expect(page.locator('#input-profile--deployment')).toHaveValue('Multi-AZ');
  await expect(page.locator('#input-profile--licenseModel')).toHaveValue('Bring your own license');
  await expect(page.locator('#input-profile--databaseEdition')).toHaveValue('Enterprise');
  await expect(page.locator('#input-component-storage-gp3-volumeType')).toHaveValue('General Purpose');
  await expect(page.locator('#input-component-storage-gp3-gbMonths')).toHaveValue('100');
  await expect(page.locator('#input-component-backup-storage-additionalGbMonths')).toHaveValue('0');
  await expect(page.locator('[data-toggle="database-insights"]')).toBeChecked();

  const slider = page.locator('[data-instance-drawer-width]');
  await slider.evaluate(el => { el.value = '900'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect.poll(async () => Math.round((await page.locator('#service-drawer').boundingBox()).width)).toBe(900);

  const typeFilter = page.locator('[data-instance-filter="instanceType"]');
  await typeFilter.fill('db.m3.2xlarge');
  await expect(page.locator('[data-instance-choice="db.m3.2xlarge"]')).toHaveCount(1);
  await page.locator('#input-component-storage-gp3-volumeType').selectOption('General Purpose-GP3');
  await expect(page.locator('#input-component-storage-gp3-volumeType')).toHaveValue('General Purpose-GP3');
  await page.locator('#input-component-backup-storage-additionalGbMonths').fill('15');
  await page.locator('#input-component-backup-storage-additionalGbMonths').press('Tab');
  await expect(page.locator('#input-component-backup-storage-additionalGbMonths')).toHaveValue('15');
});
