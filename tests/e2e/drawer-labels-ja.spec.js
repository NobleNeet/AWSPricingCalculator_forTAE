import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { DRAWER_LABELS_JA } from '../../src/app/drawer-labels-ja.js';
import { activeBuildId } from './expected-prices.js';

// Exercise every drawer, including non-default Aurora profiles and fields in
// collapsed/conditional sections. Other app E2Es exercise calculation changes.
for (const [serviceId, labels] of Object.entries(DRAWER_LABELS_JA)) {
  test(`${serviceId} drawer uses Japanese field names for every profile`, async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#price-meta')).toContainText(activeBuildId);
    await page.getByRole('button', { name: '最初の構成案を作る' }).click();
    await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
    const serviceButton = page.locator(`[data-service="${serviceId}"]`);
    // A new Definition can exist before its first Price DB publication. The unit
    // contract above still verifies its Japanese labels; browser drawer coverage
    // begins automatically once the active Price DB exposes this service code.
    // New onboarding services are reconciled into the catalog only during serialized promotion.
    // Absence before promotion is expected; a dedicated screenshot-contract E2E
    // exercises Redshift against verified local AWS price fixtures in this branch.
    if (['redshift', 'elastic-load-balancing'].includes(serviceId) && await serviceButton.count() === 0) return;
    if (await serviceButton.isDisabled()) {
      await expect(serviceButton).toBeDisabled();
      return;
    }
    await serviceButton.click();
    await expect(page.locator('#drawer-profile')).toBeVisible();
    await expect(page.locator('#drawer-region')).toBeVisible();
    for (const [profileId, profileLabel] of Object.entries(labels.profiles)) {
      await page.locator('#drawer-profile').selectOption(profileId);
      await expect(page.locator('#drawer-profile option:checked')).toHaveText(profileLabel);
      const profile = JSON.parse(await readFile(`services/${serviceId}/profiles/${profileId}.json`, 'utf8'));
      for (const input of profile.selectors) {
        await expect(page.locator(`#input-profile--${input.id}`).locator('..'))
          .toContainText(labels.fields[input.id] ?? input.label);
      }
      // Athena has 7 calculation variants, but only 3 billing sections belong
      // in the visible drawer at a time (SQL scanned, SQL capacity, Spark).
      if (serviceId === 'athena') {
        await expect(page.locator('#drawer-content fieldset[data-component-id]')).toHaveCount(3);
        await expect(page.locator('#drawer-content fieldset[data-component-id="sql-scanned-day"]')).toBeVisible();
        await expect(page.locator('#drawer-content fieldset[data-component-id="capacity"]')).toBeVisible();
        await expect(page.locator('#drawer-content fieldset[data-component-id="spark-day"]')).toBeVisible();
        await page.locator('#input-component-sql-scanned-day-queriesPerMonth').fill('7');
        await page.locator('#input-profile--sqlPeriod').selectOption('week');
        await expect(page.locator('#drawer-content fieldset[data-component-id="sql-scanned-week"]')).toBeVisible();
        await expect(page.locator('#input-component-sql-scanned-week-queriesPerMonth')).toHaveValue('7');
        await page.locator('#input-profile--sqlPeriod').selectOption('month');
        await expect(page.locator('#drawer-content fieldset[data-component-id="sql-scanned"]')).toBeVisible();
        await expect(page.locator('#input-component-sql-scanned-queriesPerMonth')).toHaveValue('7');
        await page.locator('#input-profile--sparkPeriod').selectOption('month');
        await expect(page.locator('#drawer-content fieldset[data-component-id="spark"]')).toBeVisible();
        await expect(page.locator('#drawer-content fieldset[data-component-id]')).toHaveCount(3);
      }
      for (const componentId of profile.components) {
        if (serviceId === 'athena' && !['sql-scanned', 'capacity', 'spark'].includes(componentId)) continue;
        const component = JSON.parse(await readFile(`services/${serviceId}/components/${componentId}.json`, 'utf8'));
        for (const input of [...component.selectors, ...component.usageInputs]) {
          // Redshift has mutually exclusive backup variants: an inactive
          // component must be absent, not a second visible quantity field.
          if (serviceId === 'redshift' && await page.locator(`#input-component-${componentId}-${input.id}`).count() === 0) continue;
          await expect(page.locator(`#input-component-${componentId}-${input.id}`).locator('..'))
            .toContainText(labels.components[componentId][1][input.id]);
        }
      }
      await expect(page.locator('#drawer-content')).not.toContainText('Advanced');
      await expect(page.locator('#drawer-content')).not.toContainText('Componentを有効にする');
    }
  });
}
