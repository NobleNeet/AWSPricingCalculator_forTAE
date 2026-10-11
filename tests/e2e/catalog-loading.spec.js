import { test, expect } from '@playwright/test';

test('a catalog opened during loading updates when the original response arrives', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  // Delay the original response; never replace its content or prices.
  await page.route('**/services/catalog.json', async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '最初の構成案を作る' }).click();
    await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
    await expect(page.locator('#catalog-list')).toHaveText('サービス一覧を読み込み中…');
    release();
    await expect(page.locator('#catalog-modal')).toBeVisible();
    await expect(page.locator('[data-service="ec2"]')).toBeEnabled();
    await page.locator('[data-service="ec2"]').click();
    await expect(page.locator('td[data-instance] .amount')).toHaveText(/^\$/);
  } finally {
    release();
  }
});
