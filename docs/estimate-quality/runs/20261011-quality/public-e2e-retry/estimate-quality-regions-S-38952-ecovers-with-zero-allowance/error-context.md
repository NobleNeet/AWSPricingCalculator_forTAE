# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: estimate-quality-regions.spec.js >> Scheduler refuses an ambiguous cross-region free allocation and recovers with zero allowance
- Location: tests/e2e/estimate-quality-regions.spec.js:3:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('#drawer-region')
Expected: "inherit"
Received: "us-east-1"
Timeout:  15000ms

Call log:
  - Expect "toHaveValue" locator('#drawer-region') with timeout 15000ms
  - waiting for locator('#drawer-region')
    33 × locator resolved to <select id="drawer-region">…</select>
       - unexpected value "us-east-1"

```

```yaml
- combobox "リージョン":
  - option "プロジェクトのリージョンを継承"
  - option "アジアパシフィック (東京) に変更"
  - option "us-east-1 に変更" [selected]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Scheduler refuses an ambiguous cross-region free allocation and recovers with zero allowance',async({page})=>{
  4  |  await page.goto('./');
  5  |  await expect(page.locator('#price-meta')).toContainText(/Price Data \d{4}-\d{2}-\d{2}/);
  6  |  await page.getByRole('button',{name:'最初の構成案を作る'}).click();
  7  |  async function add(region){
  8  |   await page.getByRole('button',{name:'サービスを追加',exact:true}).click();
  9  |   await page.locator('[data-service="eventbridge"]').click();
  10 |   // A newly opened drawer can briefly contain the previous row while its
  11 |   // region's price products load. Wait for the new row before editing it.
  12 |   await expect(page.locator('td[data-instance] .amount').last()).toHaveText(/^\$/);
> 13 |   await expect(page.locator('#drawer-region')).toHaveValue('inherit');
     |                                                ^ Error: expect(locator).toHaveValue(expected) failed
  14 |   if(region)await page.locator('#drawer-region').selectOption(region);
  15 |   const input=page.locator('#input-profile--schedulerInvocationsMillions');
  16 |   await input.waitFor({state:'attached'});
  17 |   if(!await input.isVisible())await input.locator('xpath=ancestor::details').locator('summary').click();
  18 |   await input.fill('10');await input.press('Tab');
  19 |   await expect(input).toHaveValue('10');
  20 |   await expect(page.locator('td[data-instance]').last()).toContainText('schedulerInvocationsMillions: 10');
  21 |   await page.getByLabel('編集を閉じる').click();
  22 |  }
  23 |  await add('ap-northeast-1');
  24 |  await page.locator('#project-region').selectOption('us-east-1');
  25 |  await add();
  26 |  await expect(page.locator('#workspace')).toContainText('無料枠の配分を確定できません');
  27 |  await expect(page.locator('td[data-instance] .amount').first()).toHaveText('—');
  28 |  await expect(page.locator('td[data-instance] .amount').last()).toHaveText('—');
  29 |  await page.locator('#scheduler-free-remaining').fill('0');
  30 |  await page.locator('#scheduler-free-remaining').press('Tab');
  31 |  await expect(page.locator('td[data-instance] .amount').first()).toHaveText(/^\$/);
  32 |  await expect(page.locator('td[data-instance] .amount').last()).toHaveText(/^\$/);
  33 |  await expect(page.locator('[data-total] .amount')).toHaveText(/^\$/);
  34 |  await expect(page.locator('#workspace')).not.toContainText('無料枠の配分を確定できません');
  35 | });
  36 | 
```