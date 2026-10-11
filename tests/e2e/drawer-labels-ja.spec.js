import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { DRAWER_LABELS_JA } from '../../src/app/drawer-labels-ja.js';

// Exercise every drawer, including non-default Aurora profiles and fields in
// collapsed/conditional sections. Other app E2Es exercise calculation changes.
for (const [serviceId, labels] of Object.entries(DRAWER_LABELS_JA)) {
  test(`${serviceId} drawer uses Japanese field names for every profile`, async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: '最初の構成案を作る' }).click();
    await page.getByRole('button', { name: 'サービスを追加', exact: true }).click();
    await page.locator(`[data-service="${serviceId}"]`).click();
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
      for (const componentId of profile.components) {
        const component = JSON.parse(await readFile(`services/${serviceId}/components/${componentId}.json`, 'utf8'));
        for (const input of [...component.selectors, ...component.usageInputs]) {
          await expect(page.locator(`#input-component-${componentId}-${input.id}`).locator('..'))
            .toContainText(labels.components[componentId][1][input.id]);
        }
      }
      await expect(page.locator('#drawer-content')).not.toContainText('Advanced');
      await expect(page.locator('#drawer-content')).not.toContainText('Componentを有効にする');
    }
  });
}
