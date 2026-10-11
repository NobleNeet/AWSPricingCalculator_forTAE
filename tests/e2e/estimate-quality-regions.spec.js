import { test, expect } from '@playwright/test';

test('Scheduler refuses an ambiguous cross-region free allocation and recovers with zero allowance',async({page})=>{
 await page.goto('./');
 await expect(page.locator('#price-meta')).toContainText(/Price Data \d{4}-\d{2}-\d{2}/);
 await page.getByRole('button',{name:'最初の構成案を作る'}).click();
 async function add(region){
  await page.getByRole('button',{name:'サービスを追加',exact:true}).click();
  await page.locator('[data-service="eventbridge"]').click();
  if(region)await page.locator('#drawer-region').selectOption(region);
  const input=page.locator('#input-profile--schedulerInvocationsMillions');
  await input.waitFor({state:'attached'});
  if(!await input.isVisible())await input.locator('xpath=ancestor::details').locator('summary').click();
  await input.fill('10');await input.press('Tab');
  await page.getByLabel('編集を閉じる').click();
 }
 await add('ap-northeast-1');
 await page.locator('#project-region').selectOption('us-east-1');
 await add();
 await expect(page.locator('#workspace')).toContainText('無料枠の配分を確定できません');
 await expect(page.locator('td[data-instance] .amount').first()).toHaveText('—');
 await expect(page.locator('td[data-instance] .amount').last()).toHaveText('—');
 await page.locator('#scheduler-free-remaining').fill('0');
 await page.locator('#scheduler-free-remaining').press('Tab');
 await expect(page.locator('td[data-instance] .amount').first()).toHaveText(/^\$/);
 await expect(page.locator('td[data-instance] .amount').last()).toHaveText(/^\$/);
 await expect(page.locator('#workspace')).not.toContainText('無料枠の配分を確定できません');
});
