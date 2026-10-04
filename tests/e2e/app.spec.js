import { test, expect } from '@playwright/test';
import { activeBuildId, expected } from './expected-prices.js';

test('create, real EC2, multiple services, duplicate, replace, usage, row add and delete, resume', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('構成案はまだありません')).toBeVisible();
  await expect(page.locator('#price-meta')).toContainText(activeBuildId);
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();
  await expect(page.locator('#service-drawer')).toBeVisible();
  await expect(page.locator('[data-instance-picker="ec2"]')).toBeVisible();
  const software = page.locator('[data-scope="profile"][data-field="software"]');
  await expect(software).toHaveValue('NA');
  const os = page.locator('[data-scope="profile"][data-field="os"]');
  await expect(os.locator('option[value="Windows"]')).toHaveCount(1);
  await os.selectOption('Windows');
  await expect(page.locator('[data-scope="profile"][data-field="software"]')).toHaveValue('NA');
  await page.locator('[data-scope="profile"][data-field="os"]').selectOption('Linux');
  await expect(page.locator('[data-scope="profile"][data-field="software"]')).toHaveValue('NA');
  const calculatorOrder = await page.evaluate(() => {
    const nodes = [
      document.querySelector('#input-component-instance-quantity')?.closest('label'),
      document.querySelector('#input-component-instance-instanceType')?.closest('label'),
      document.querySelector('[data-instance-picker="ec2"]'),
      document.querySelector('#input-component-instance-hours')?.closest('label')
    ];
    return nodes.every(Boolean) && nodes.slice(1).every((node, index) => Boolean(nodes[index].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(calculatorOrder).toBe(true);
  await expect(page.locator('#workspace')).toContainText(expected.ec2.display);
  await page.getByLabel('編集を閉じる').click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="s3"]').click();
  await expect(page.locator('#workspace')).toContainText(expected.s3.display);
  await page.getByLabel('編集を閉じる').click();
  await page.getByRole('button', { name: 'Planを複製', exact: true }).click();
  await expect(page.locator('thead th[data-plan]')).toHaveCount(2);
  await expect(page.locator('[data-total]').nth(1)).toContainText('$0.00');
  const secondCell = page.locator('tbody tr').first().locator('td[data-instance]').nth(1);
  await secondCell.getByRole('button', { name: '編集', exact: true }).click();
  await page.locator('#input-component-instance-hours').fill('100');
  await page.locator('#input-component-instance-hours').press('Tab');
  await expect(secondCell).toContainText(expected.ec2Edited.display);
  await page.getByLabel('編集を閉じる').click();
  await secondCell.getByRole('button', { name: '別サービスへ置換' }).click();
  await page.locator('[data-service="lambda"]').click();
  await expect(secondCell).toContainText('AWS Lambda');
  await expect(secondCell).toContainText(expected.lambda.display);
  await page.getByLabel('編集を閉じる').click();
  await page.reload();
  await expect(page.locator('thead th[data-plan]')).toHaveCount(2);
  await expect(page.locator('#workspace')).toContainText('AWS Lambda');
  await page.getByRole('button', { name: 'Planから外す', exact: true }).first().click();
  await page.getByRole('button', { name: 'この行に追加', exact: true }).first().click();
  await page.locator('[data-service="ebs"]').click();
  await expect(page.locator('#workspace')).toContainText(expected.ebs.display);
  await page.getByLabel('編集を閉じる').click();
  await page.getByRole('button', { name: 'Planを削除', exact: true }).last().click();
  await expect(page.locator('thead th[data-plan]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Planを削除', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/workspace.png', fullPage: true });
});
test('mobile Drawer stays usable at narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./'); await expect(page.locator('#price-meta')).toContainText(activeBuildId);
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click(); await page.locator('[data-service="ec2"]').click();
  await expect(page.locator('#input-component-instance-hours')).toBeVisible();
  await expect(page.locator('#workspace')).toContainText(expected.ec2.display);
  const bounds = await page.locator('#service-drawer').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/mobile-drawer.png', fullPage: true });
});
