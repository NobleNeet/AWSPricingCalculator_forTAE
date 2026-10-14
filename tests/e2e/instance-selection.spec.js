import { test, expect } from '@playwright/test';

test('EC2 instance selection remains visible, pinned, and can be toggled off', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();

  const picker = page.locator('[data-instance-picker="ec2"]');
  await expect(picker.locator('[data-instance-current]')).not.toBeEmpty();
  const options = picker.locator('[data-instance-choice]');
  await expect(options.first()).toBeVisible();
  const chosen = await options.last().getAttribute('data-instance-choice');
  await options.last().click();

  await expect(picker.locator('[data-instance-current]')).toHaveText(chosen);
  await expect(picker.locator('tbody tr').first()).toHaveClass(/selected/);
  await expect(picker.locator('tbody tr').first().locator('[data-instance-choice]')).toHaveAttribute('data-instance-choice', chosen);
  await expect(picker.locator('tbody tr').first().locator('[data-instance-choice]')).toHaveAttribute('aria-pressed', 'true');

  await picker.locator('[data-instance-sort="vcpu"]').click();
  await picker.locator('[data-instance-sort="vcpu"]').click();
  await expect(picker.locator('tbody tr').first().locator('[data-instance-choice]')).toHaveAttribute('data-instance-choice', chosen);

  await picker.locator('tbody tr').first().locator('[data-instance-choice]').click();
  await expect(picker.locator('[data-instance-current]')).toHaveText('未選択');
  await expect(picker.locator('tbody tr.selected')).toHaveCount(0);
});
