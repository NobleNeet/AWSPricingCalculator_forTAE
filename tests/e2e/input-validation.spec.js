import { test, expect } from '@playwright/test';
test('invalid inputs suppress the estimate and recover without silently changing saved usage', async ({page}) => {
 await page.goto('./');
 await page.getByRole('button',{name:'最初の構成案を作る'}).click();
 await page.getByRole('button',{name:'サービスを追加',exact:true}).click();
 await page.locator('[data-service="rds"]').click();
 const quantity=page.locator('#input-component-instance-quantity');
 await expect(quantity).toHaveAttribute('min','1');
 await expect(quantity).toHaveAttribute('step','1');
 await quantity.fill('0');await quantity.press('Tab');
 await expect(page.locator('td[data-instance] .amount')).toHaveText('—');
 await expect(quantity).toHaveValue('0');
 await expect(quantity).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#drawer-content')).toContainText('1以上の値');
 await quantity.fill('1');await quantity.press('Tab');
 const hours=page.locator('#input-component-instance-hours');
 for(const value of ['0','1460']){
  await hours.fill(value);await hours.press('Tab');
  await expect(page.locator('td[data-instance] .amount')).toHaveText('—');
  await expect(hours).toHaveValue(value);
  await expect(hours).toHaveAttribute('aria-invalid','true');
 }
 await hours.fill('0.5');await hours.press('Tab');
 await expect(page.locator('td[data-instance] .amount')).toHaveText(/^\$/);
 await expect(hours).toHaveAttribute('aria-invalid','false');
 await expect(hours).toHaveValue('0.5');
});
