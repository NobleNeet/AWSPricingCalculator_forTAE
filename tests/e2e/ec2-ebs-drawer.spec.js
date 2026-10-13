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
  await expect(ebs.locator('[data-component-id="ebs-io2-iops"]')).toHaveCount(0);
  await expect(ebs.locator('[data-component-id="ebs-gp3-iops"]')).toHaveCount(1);
  await ebs.locator('#input-profile--ebsVolumeType').selectOption('gp2');
  await expect(ebs.locator('[data-component-id="ebs-gp3-iops"]')).toHaveCount(0);
  await expect(ebs.locator('[data-component-id="ebs-io2-iops"]')).toHaveCount(0);
});

test('EC2 custom monthly costs survive save/reload and are added once to the estimate', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();
  const cost = page.locator('#ec2-additional-cost');
  await expect(cost).toHaveValue('0');
  const subtotal = Number((await page.locator('td[data-instance] .amount').innerText()).replace(/[$,]/g, ''));
  await cost.fill('3.25');
  await cost.press('Tab');
  await expect.poll(async () => Number((await page.locator('td[data-instance] .amount').innerText()).replace(/[$,]/g, ''))).toBeCloseTo(subtotal + 3.25, 2);
  await page.getByLabel('編集を閉じる').click();
  await page.reload();
  await page.locator('td[data-instance] button[data-action="edit"]').click();
  await expect(page.locator('#ec2-additional-cost')).toHaveValue('3.25');
  await expect.poll(async () => Number((await page.locator('td[data-instance] .amount').innerText()).replace(/[$,]/g, ''))).toBeCloseTo(subtotal + 3.25, 2);
});

test('EC2 detailed monitoring is opt-in, and missing pricing must not masquerade as zero', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();
  const monitoring = page.locator('[data-component-id="detailed-monitoring"]');
  await expect(monitoring).toBeVisible();
  await expect(monitoring.locator('[data-toggle="detailed-monitoring"]')).not.toBeChecked();
  await expect(monitoring.locator('#input-component-detailed-monitoring-metricsPerInstance')).toBeDisabled();
  await monitoring.locator('[data-toggle="detailed-monitoring"]').check();
  await expect(monitoring.locator('#input-component-detailed-monitoring-metricsPerInstance')).toBeEnabled();
  await expect(page.locator('[data-toggle="detailed-monitoring"]')).toBeChecked();
});

test('EC2 inbound transfer is free and outbound transfer meters are opt-in', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="ec2"]').click();
  const price = page.locator('td[data-instance] .amount');
  await expect(price).toHaveText(/^\\$/);
  const initial = await price.innerText();
  await expect(page.locator('[data-toggle="transfer-internet-out"]')).not.toBeChecked();
  await expect(page.locator('[data-toggle="transfer-regional"]')).not.toBeChecked();
  const inbound = page.locator('#input-profile--transferInboundGb');
  await expect(inbound).toBeVisible();
  await inbound.fill('250');
  await inbound.press('Tab');
  await expect(price).toHaveText(initial);
  await expect(page.locator('#input-profile--transferInboundGb')).toHaveValue('250');
  await expect(page.locator('[data-component-id="transfer-internet-out"] .component-price')).toContainText('—');
});
