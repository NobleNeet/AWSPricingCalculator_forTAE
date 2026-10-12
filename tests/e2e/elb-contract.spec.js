import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalize } from '../../tools/pricing-cli/normalize.js';

const contract = {
  referenceUrl: 'https://calculator.aws/#/createCalculator/ElasticLoadBalancing',
  families: [
    { id: 'alb', title: 'Application Load Balancer', count: 'albCount' },
    { id: 'nlb', title: 'Network Load Balancer', count: 'nlbCount' },
    { id: 'gwlb', title: 'Gateway Load Balancer', count: 'gwlbCount' },
    { id: 'clb', title: 'Classic Load Balancer', count: 'clbCount' }
  ]
};

async function mockUnpublishedElb(page) {
  const manifest = JSON.parse(await readFile('pricing/generated/manifest.json', 'utf8'));
  const sourceEntries = {};
  for (const code of ['AWSELB', 'AmazonVPC']) {
    const raw = JSON.parse(await readFile(`tests/fixtures/aws/${code}.json`, 'utf8'));
    const json = JSON.stringify(normalize(raw, 'ap-northeast-1', manifest.activeBuildId).data);
    sourceEntries[code] = { json, checksum: createHash('sha256').update(json).digest('hex') };
    await page.route(`**/sources/${code}/ap-northeast-1/products.json`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: json })
    );
  }
  await page.route('**/services/catalog.json', async route => {
    const response = await route.fetch();
    const data = await response.json();
    data.services = data.services.filter(x => x.id !== 'elastic-load-balancing');
    data.services.push({ id: 'elastic-load-balancing', label: 'Elastic Load Balancing', serviceCode: 'AWSELB', available: true });
    await route.fulfill({ response, body: JSON.stringify(data) });
  });
  await page.route('**/build-manifest.json', async route => {
    const response = await route.fetch();
    const build = await response.json();
    for (const [code, { checksum }] of Object.entries(sourceEntries)) {
      build.sources[code] = { 'ap-northeast-1': {
        productsPath: `sources/${code}/ap-northeast-1/products.json`,
        productsSha256: checksum,
        indexPath: `indexes/${code}/ap-northeast-1/index.json`
      } };
    }
    await route.fulfill({ response, body: JSON.stringify(build) });
  });
}

test('ELB four-family screenshot contract: single quantities and conditional inputs', async ({ page }) => {
  await mockUnpublishedElb(page);
  await page.goto('./');
  await page.getByRole('button', { name: '最初の構成案を作る' }).click();
  await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
  await page.locator('[data-service="elastic-load-balancing"]').click();
  await expect(page.locator('#drawer-profile')).toHaveValue('standard');

  for (const { id, count } of contract.families) {
    await expect(page.locator(`#input-profile--${id}Enabled`)).toBeVisible();
    await expect(page.locator(`#input-profile--${count}`)).toHaveCount(1);
    await expect(page.locator(`#input-profile--${count}`)).toHaveValue('1');
  }
  const group = page.locator('[data-elb-type-choices]');
  await expect(group).toBeVisible();
  await expect(group.locator('input[type=checkbox]')).toHaveCount(4);
  for (const { id } of contract.families) {
    await expect(group.locator(`#input-profile--${id}Enabled`)).toBeChecked();
    const familySection = page.locator(`#drawer-content fieldset[data-component-id="${id}"]`);
    await expect(familySection).toBeVisible();
    await expect(familySection.locator('[data-elb-section-prices]')).toBeVisible();
    const ordering = await familySection.evaluate(node => {
      const field = node.querySelector('input[data-scope="profile"]');
      const charges = node.querySelector('[data-elb-section-prices]');
      return Boolean(field && charges && (field.compareDocumentPosition(charges) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    expect(ordering).toBeTruthy();
  }
  await expect(page.locator('[data-elb-price]')).toHaveCount(12);
  await expect(page.locator('#drawer-content fieldset[data-component-id="alb-hour"]')).toHaveCount(0);
  await group.locator('#input-profile--albEnabled').uncheck();
  await expect(page.locator('#drawer-content fieldset[data-component-id="alb"]')).toHaveCount(0);
  await expect(page.locator('[data-elb-price="alb-hour"]')).toHaveCount(0);
  await group.locator('#input-profile--albEnabled').check();
  await expect(page.locator('#drawer-content fieldset[data-component-id="alb"]')).toBeVisible();
  await expect(page.locator('[data-elb-price="alb-hour"]')).toHaveCount(1);
  await expect(page.locator('#input-profile--albTarget')).toHaveValue('ec2');
  await expect(page.locator('#input-profile--nlbtcpNew')).toHaveCount(1);
  await expect(page.locator('#input-profile--nlbudpNew')).toHaveCount(1);
  await expect(page.locator('#input-profile--nlbtlsNew')).toHaveCount(1);
  await expect(page.locator('#input-profile--gwlbeCount')).toHaveValue('1');
  await expect(page.locator('#input-profile--clbGbMonth')).toHaveCount(1);

  const albGb = page.locator('#input-profile--albGbHour');
  await albGb.fill('1');
  await albGb.dispatchEvent('change');
  await expect(albGb).toHaveValue('1');
  await page.locator('#input-profile--albTarget').selectOption('lambda');
  await expect(albGb).toHaveValue('1');
  await expect(page.locator('#input-profile--albGbHour')).toHaveCount(1);
  await expect(page.locator('#drawer-content')).not.toContainText('Componentを有効にする');
});
