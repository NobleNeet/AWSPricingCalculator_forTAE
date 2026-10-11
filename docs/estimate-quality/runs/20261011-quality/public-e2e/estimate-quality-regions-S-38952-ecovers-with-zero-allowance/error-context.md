# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: estimate-quality-regions.spec.js >> Scheduler refuses an ambiguous cross-region free allocation and recovers with zero allowance
- Location: tests/e2e/estimate-quality-regions.spec.js:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#workspace')
Expected substring: "無料枠の配分を確定できません"
Received string:    "1 構成案 · 2 比較行空のPlanを追加比較項目案 1Baseline名称・メモPlanを複製サービスを追加Amazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10$0.00無料枠控除前: $12.50 / 控除後: $0.00Pricing Limitationあり編集別サービスへ置換Planから外すAmazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0$0.00無料枠控除前: $0.00 / 控除後: $0.00Pricing Limitationあり編集別サービスへ置換Planから外す月額 / 差額月額合計$0.00Baselineとの差額: $0.00"
Timeout: 15000ms

Call log:
  - Expect "toContainText" locator('#workspace') with timeout 15000ms
  - waiting for locator('#workspace')
    3 × locator resolved to <section id="workspace" aria-label="構成案の比較">…</section>
      - unexpected value "1 構成案 · 2 比較行空のPlanを追加比較項目案 1Baseline名称・メモPlanを複製サービスを追加Amazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10$0.00無料枠控除前: $12.50 / 控除後: $0.00Pricing Limitationあり編集別サービスへ置換Planから外すAmazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0—料金データ読込中…編集別サービスへ置換Planから外す月額 / 差額計算済み小計$0.00未計算サービス: 1差額: 未計算項目があるため比較不可"
    30 × locator resolved to <section id="workspace" aria-label="構成案の比較">…</section>
       - unexpected value "1 構成案 · 2 比較行空のPlanを追加比較項目案 1Baseline名称・メモPlanを複製サービスを追加Amazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10$0.00無料枠控除前: $12.50 / 控除後: $0.00Pricing Limitationあり編集別サービスへ置換Planから外すAmazon EventBridge行名を編集Amazon EventBridgepayloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0$0.00無料枠控除前: $0.00 / 控除後: $0.00Pricing Limitationあり編集別サービスへ置換Planから外す月額 / 差額月額合計$0.00Baselineとの差額: $0.00"

```

```yaml
- region "構成案の比較":
  - text: 1 構成案 · 2 比較行
  - button "空のPlanを追加"
  - table:
    - rowgroup:
      - row "比較項目 案 1 Baseline 名称・メモ Planを複製 サービスを追加":
        - columnheader "比較項目"
        - columnheader "案 1 Baseline 名称・メモ Planを複製 サービスを追加":
          - heading "案 1" [level=2]
          - text: Baseline
          - button "名称・メモ"
          - button "Planを複製"
          - button "サービスを追加"
    - rowgroup:
      - 'row "Amazon EventBridge 行名を編集 Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10 $0.00 無料枠控除前: $12.50 / 控除後: $0.00 Pricing Limitationあり 編集 別サービスへ置換 Planから外す"':
        - cell "Amazon EventBridge 行名を編集":
          - text: Amazon EventBridge
          - button "行名を編集"
        - 'cell "Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10 $0.00 無料枠控除前: $12.50 / 控除後: $0.00 Pricing Limitationあり 編集 別サービスへ置換 Planから外す"':
          - text: "Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 10 $0.00 無料枠控除前: $12.50 / 控除後: $0.00 Pricing Limitationあり"
          - button "編集"
          - button "別サービスへ置換"
          - button "Planから外す"
      - 'row "Amazon EventBridge 行名を編集 Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0 $0.00 無料枠控除前: $0.00 / 控除後: $0.00 Pricing Limitationあり 編集 別サービスへ置換 Planから外す"':
        - cell "Amazon EventBridge 行名を編集":
          - text: Amazon EventBridge
          - button "行名を編集"
        - 'cell "Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0 $0.00 無料枠控除前: $0.00 / 控除後: $0.00 Pricing Limitationあり 編集 別サービスへ置換 Planから外す"':
          - text: "Amazon EventBridge payloadSizeKb: 1 · awsManagementEventsMillions: 0 · awsOptInDataEventsMillions: 0 · customEventsMillions: 0 · partnerEventsMillions: 0 · crossAccountManagementEventsMillions: 0 · crossAccountCustomEventsMillions: 0 · crossAccountPartnerEventsMillions: 0 · apiDestinationInvocationsMillions: 0 · replayedEventsMillions: 0 · archiveEventsMillions: 0 · archiveStorageGbMonth: 0 · pipesRequestsMillions: 0 · schemaDiscoveryEventsMillions: 0 · schedulerInvocationsMillions: 0 $0.00 無料枠控除前: $0.00 / 控除後: $0.00 Pricing Limitationあり"
          - button "編集"
          - button "別サービスへ置換"
          - button "Planから外す"
      - 'row "月額 / 差額 月額合計 $0.00 Baselineとの差額: $0.00"':
        - cell "月額 / 差額"
        - 'cell "月額合計 $0.00 Baselineとの差額: $0.00"'
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
  10 |   if(region)await page.locator('#drawer-region').selectOption(region);
  11 |   const input=page.locator('#input-profile--schedulerInvocationsMillions');
  12 |   await input.waitFor({state:'attached'});
  13 |   if(!await input.isVisible())await input.locator('xpath=ancestor::details').locator('summary').click();
  14 |   await input.fill('10');await input.press('Tab');
  15 |   await page.getByLabel('編集を閉じる').click();
  16 |  }
  17 |  await add('ap-northeast-1');
  18 |  await page.locator('#project-region').selectOption('us-east-1');
  19 |  await add();
> 20 |  await expect(page.locator('#workspace')).toContainText('無料枠の配分を確定できません');
     |                                           ^ Error: expect(locator).toContainText(expected) failed
  21 |  await expect(page.locator('td[data-instance] .amount').first()).toHaveText('—');
  22 |  await expect(page.locator('td[data-instance] .amount').last()).toHaveText('—');
  23 |  await page.locator('#scheduler-free-remaining').fill('0');
  24 |  await page.locator('#scheduler-free-remaining').press('Tab');
  25 |  await expect(page.locator('td[data-instance] .amount').first()).toHaveText(/^\$/);
  26 |  await expect(page.locator('td[data-instance] .amount').last()).toHaveText(/^\$/);
  27 |  await expect(page.locator('[data-total] .amount')).toHaveText(/^\$/);
  28 |  await expect(page.locator('#workspace')).not.toContainText('無料枠の配分を確定できません');
  29 | });
  30 | 
```