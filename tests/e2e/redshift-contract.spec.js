import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalize } from '../../tools/pricing-cli/normalize.js';

// The expected visible sections/fields come from the independent user screenshot
// contract, NOT from the service's Component or Profile definitions.
const contract = JSON.parse(await readFile('services/redshift/ui-contract.json', 'utf8'));
const raw = JSON.parse(await readFile('tests/fixtures/aws/AmazonRedshift.json', 'utf8'));
const manifest = JSON.parse(await readFile('pricing/generated/manifest.json', 'utf8'));
const normalized = normalize(raw, 'ap-northeast-1', manifest.activeBuildId).data;
const productsJson = JSON.stringify(normalized);
const productsSha256 = createHash('sha256').update(productsJson).digest('hex');

async function mockUnpublishedRedshift(page) {
  await page.route('**/services/catalog.json', async route => {
    const response = await route.fetch();
    const catalog = await response.json();
    catalog.services = catalog.services.filter(service => service.id !== 'redshift');
    catalog.services.push({ id: 'redshift', label: 'Amazon Redshift', serviceCode: 'AmazonRedshift', available: true });
    await route.fulfill({ response, body: JSON.stringify(catalog) });
  });
  await page.route('**/build-manifest.json', async route => {
    const response = await route.fetch();
    const build = await response.json();
    build.sources.AmazonRedshift = {
      'ap-northeast-1': {
        productsPath: 'sources/AmazonRedshift/ap-northeast-1/products.json',
        productsSha256,
        indexPath: 'indexes/AmazonRedshift/ap-northeast-1/index.json'
      }
    };
    await route.fulfill({ response, body: JSON.stringify(build) });
  });
  await page.route('**/sources/AmazonRedshift/ap-northeast-1/products.json', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: productsJson })
  );
}

const currentSections = async page => page.locator('#drawer-content fieldset[data-component-id]:visible').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-component-id')));

test('Redshift screenshot-derived visible contract switches without duplicate fields', async ({ page }) => {
  await mockUnpublishedRedshift(page);
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="redshift"]').click();
  await expect(page.locator('#drawer-profile')).toBeVisible();

  const provisioned = contract.modes.provisioned;
  expect(provisioned.sections.map(s => s.id)).toEqual(['instance', 'backup', 'spectrum', 'managedStorage', 'dataTransfer']);
  expect(await currentSections(page)).toEqual(['node-compute', 'backup-tiered', 'spectrum', 'rms-provisioned', 'transfer']);
  await expect(page.locator('#input-component-node-compute-nodes')).toHaveValue('1');
  await expect(page.locator('#input-profile--instanceType')).toHaveValue('dc2.8xlarge');
  await expect(page.locator('#input-component-node-compute-utilization')).toHaveValue('100');
  await expect(page.locator('[data-component-id="node-compute"] #input-profile--instanceType')).toBeVisible();
  await expect(page.locator('[data-component-id="transfer"] #input-profile--transferInGb')).toBeVisible();
  await expect(page.locator('#input-profile--instanceType')).toHaveCount(1);
  await expect(page.locator('#input-profile--transferInGb')).toHaveCount(1);
  await expect(page.locator('[data-component-id="serverless-compute"]')).toHaveCount(0);
  await expect(page.locator('#input-component-spectrUm-scannedTb')).toHaveCount(0);

  // Changing an instance family must exchange the backup charge, not duplicate its input.
  await page.locator('#input-profile--instanceType').selectOption('rg.large');
  await expect(page.locator('[data-component-id="backup-rg"]')).toBeVisible();
  await expect(page.locator('[data-component-id="backup-tiered"]')).toHaveCount(0);
  await expect(page.locator('input[data-field="backupGb"]:visible')).toHaveCount(1);

  await page.locator('#drawer-profile').selectOption('serverless');
  const serverless = contract.modes.serverless;
  expect(serverless.sections.map(s => s.id)).toEqual(['serverless', 'backup', 'managedStorage', 'dataTransfer']);
  expect(await currentSections(page)).toEqual(['serverless-compute', 'backup-serverless', 'rms-serverless', 'transfer']);
  await expect(page.locator('#input-component-serverless-compute-workloadSize')).toHaveValue('Medium');
  await expect(page.locator('#input-component-serverless-compute-baseRpu')).toHaveValue('128');
  await expect(page.locator('#input-component-serverless-compute-runtimeDailyHours')).toHaveValue('1');
  await expect(page.locator('[data-component-id="transfer"] #input-profile--transferInGb')).toBeVisible();
  await expect(page.locator('input[data-field="backupGb"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-component-id="spectrum"]')).toHaveCount(0);
  await expect(page.locator('[data-component-id="node-compute"]')).toHaveCount(0);

  // Price data is derived from independent raw-shaped AWS evidence, not UI screenshot rates.
  await expect(page.locator('#drawer-content .state')).not.toContainText('未計算');
});
