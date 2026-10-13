import { test, expect } from '@playwright/test';

test('EC2 groups its EBS controls and does not expose internal io2 billing tiers as fields', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();
  const drawer = page.locator('#service-drawer');
  const ebs = drawer.locator('[data-ec2-ebs-section]');
  await expect(ebs).toBeVisible();
  await expect(ebs.locator('#input-profile--ebsVolumeType')).toHaveCount(1);
  await expect(drawer.locator('#input-profile--ebsVolumeType')).toHaveCount(1);
  await expect(drawer.locator('[data-component-id="ebs-io2-iops-tier2"]')).toHaveCount(0);
  await expect(drawer.locator('[data-component-id="ebs-io2-iops-tier3"]')).toHaveCount(0);
  await expect(drawer.locator('[data-ec2-ebs-tier-note]')).toHaveCount(0);
  await ebs.locator('#input-profile--ebsVolumeType').selectOption('io2');
  await expect(drawer.locator('[data-ec2-ebs-tier-note]')).toBeVisible();
  await expect(ebs.locator('[data-component-id="ebs-io2-iops"]')).toHaveCount(1);
  await expect(ebs.locator('#input-component-ebs-io2-iops-provisionedIops')).toHaveCount(1);
  await ebs.locator('#input-profile--ebsVolumeType').selectOption('gp3');
  await expect(drawer.locator('[data-ec2-ebs-tier-note]')).toHaveCount(0);
});
