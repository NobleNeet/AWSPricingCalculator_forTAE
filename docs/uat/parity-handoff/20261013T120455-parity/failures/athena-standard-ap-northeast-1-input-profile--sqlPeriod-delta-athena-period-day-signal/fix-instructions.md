# athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: athena。Profile: "standard"。Region: "ap-northeast-1"。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/Athena。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:20:38.813Z。公開build: 20261013T095030Z-78197541。
不具合観測: Configured inputs produced a total or delta difference above $0.01; investigate math and equivalence before attributing root cause.
入力判定: FAIL。料金判定: FAIL。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/athena/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
スクリーンショットは原記録の相対パス（結果ルート基準）および同ディレクトリに複製した local-before.png / local-after.png / aws-before.png / aws-after.png が存在する範囲を参照せよ。取得済みの場合は local-before-total.png / local-after-total.png にDrawerを閉じた可視の月額合計画面を保存している。未取得の画面を取得済みと扱うな。

## 原因を確定して修正せよ

観測済み事実は下記JSONとGUI証跡に限定せよ。EC2の台数・稼働時間によるEBS差、Oracleの稼働率によるInsights差では、集計量/台数当たり容量/モニタリング時間の同等性と現行正本の指定を先に確認せよ。公式GUIと一致させるためだけに現行の入力意味や保存データ互換性を変えるな。価格正本・仕様差が確認できれば料金NOT_COMPARABLEまたは仕様問題として根拠を報告せよ。
原因仮説: Definition/UI未取り込み、Mapping/数量変換/条件分岐、公開Price DBの対応範囲・単価更新差などの可能性がある。いずれも未検証であり、差額だけで実装バグと断定するな。
最新版のService Definition、Pricing Mapping、生成Price DB、Billing Transform、UIを必要な範囲で調査し、根本原因を確定せよ。未確認のファイル名・関数名を原因と決め打ちするな。
入力欠落では docs/SERVICE_ONBOARDING.md §5–6 と現行契約を照合して必要なOn-Demand入力と依存条件を実装せよ。許容された明示的仕様除外が新たに確認できた場合は、根拠節と比較不能範囲を報告し、推測で仕様を増やすな。
期待動作: 同等の料金入力を設定でき、同等条件の合計・対応内訳・変更差分が0.01 USD以内で整合すること。計算対象外条件があれば現行正本に従い明示すること。
金額をハードコードするな。生成Price DBを手編集するな。service-specific意味はMappingへ置き、generic coreへサービス名分岐を入れるな。他サービスへの影響とvalidation scopeを保全せよ。原因不明なら先に調査せよ。

## 正本と回帰・公開確認

最新版リポジトリの AGENTS.md、docs/SPEC.md、docs/PRICING_ARCHITECTURE.md、docs/PRICING_MAPPING_ARCHITECTURE.md、docs/SERVICE_ONBOARDING.md、docs/ONBOARDING_PROMOTION_QUEUE.md、docs/AUTONOMOUS_IMPLEMENTATION.md、docs/IMPLEMENTATION_PLAN.md をAGENTS指定順序で読め。
変更前に影響する既存unit/Golden/E2Eを棚卸しし、当該サービスのnarrow test、Mapping validation、Golden、サービス別browser E2Eを更新・実行せよ。通過後に全体validation/test/E2Eの適用対象を実行せよ。
サービス拡張はreonboard/<serviceId>で進め、必要なPRとonboarding-readyキュー、serialized promotion、Price DB publication、Pages deploymentを確認せよ。公開後は本ケースの公式/公開GUI再比較と、同じ課金Componentを使う他Profile/Region/サービスの回帰確認を実施せよ。
完了条件: 根本原因と仕様根拠が説明でき、必要な入力・数量・料金の回帰チェックが通り、必要な公開反映とGUI再比較が完了していること。権限・公開障害等で残課題があれば、失敗した操作、外部条件、取得済み証跡、再開手順を報告せよ。

## 機械可読原記録（自己完結した再現情報）

```json
{
  "caseId": "athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal",
  "serviceId": "athena",
  "profile": "standard",
  "region": "ap-northeast-1",
  "parameter": "input-profile--sqlPeriod",
  "officialFieldId": "athena:SELECT:CURRENT:per month",
  "localFieldId": "athena:input-profile--sqlPeriod",
  "correspondenceRowId": "athena:input-profile--sqlPeriod",
  "comparisonScope": "parent-service",
  "runnerSha256": "c4cfb471b3ef6ce6c64573553de389b8d9dbe3c050557fa1ed6743d0d76620d1",
  "runnerSource": "runners/versions/c4cfb471b3ef6ce6c64573553de389b8d9dbe3c050557fa1ed6743d0d76620d1.mjs",
  "pricingCaseMethod": "Independent new GUI Project and official BrowserContext for each case. Baseline values set through real controls; native numeric input application verified with up to 3 bounded attempts.",
  "inputVerdict": "FAIL",
  "pricingVerdict": "FAIL",
  "toleranceUsd": "0.01",
  "plannedInputs": {
    "baseline": [
      {
        "local": "input-component-sql-scanned-day-queriesPerMonth",
        "official": "Total number of queries Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 10
      },
      {
        "local": "input-component-sql-scanned-day-scannedGbPerQuery",
        "official": "Amount of data scanned per query Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 1
      },
      {
        "local": "input-component-capacity-dpus",
        "official": "Number of DPUs Enter amount",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 4
      },
      {
        "local": "input-component-capacity-activeHours",
        "official": "Length of time capacity is active Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 1
      },
      {
        "local": "input-component-spark-day-sessionsPerMonth",
        "official": "Total number of spark sessions Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 10
      },
      {
        "local": "input-component-spark-day-dpuHoursPerSession",
        "official": "Code execution per session Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 1
      },
      {
        "local": "input-profile--sqlPeriod",
        "official": "SELECT:CURRENT:per month",
        "officialOccurrence": 0,
        "officialAssociationLabels": [
          "Total number of queries Value / Unit"
        ],
        "value": "month"
      },
      {
        "local": "input-profile--sparkPeriod",
        "official": "SELECT:CURRENT:per month",
        "officialOccurrence": 0,
        "officialAssociationLabels": [
          "Total number of spark sessions Value / Unit"
        ],
        "value": "month"
      }
    ],
    "change": {
      "local": "input-profile--sqlPeriod",
      "official": "SELECT:CURRENT:per month",
      "before": "month",
      "after": "day"
    },
    "baselineRole": "GUI configuration seed. Reproduce effectiveBaseline/localBefore/awsBefore, which include explicitly saved dependency preparation."
  },
  "inputConversions": {
    "field": "SELECT:CURRENT:per month",
    "optionMap": {
      "month": "per month",
      "day": "per day",
      "week": "per week"
    },
    "dependentSyncProcedure": null,
    "setupProcedure": "async()=>{await inputLocal('input-profile--sqlPeriod','month');if(await local.locator('#input-profile--sparkPeriod').count())await inputLocal('input-profile--sparkPeriod','month');await choose('CURRENT:per day','per month',0);if(await aws.locator('button[aria-haspopup=\"listbox\"]:visible').filter({hasText:'per day'}).count())await choose('CURRENT:per day','per month',0);if(await aws.locator('button[aria-haspopup=\"listbox\"]:visible').filter({hasText:'minutes per month'}).count())await choose('CURRENT:minutes per month','hours per month') }",
    "prepareProcedure": null,
    "variant": "athena-period-day",
    "dependentSync": null
  },
  "executionState": "FINISHED",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/Athena"
  },
  "startedAt": "2026-10-14T05:20:02.610Z",
  "localBefore": {
    "observedAt": "2026-10-14T05:20:34.290Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$6.77",
    "monthlyUsd": "6.77",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "6.77",
      "6.77"
    ],
    "inputs": [
      {
        "id": "project-region",
        "label": "Region\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "ap-northeast-1",
        "options": [
          {
            "value": "ap-northeast-1",
            "label": "Tokyo · ap-northeast-1"
          },
          {
            "value": "ap-northeast-3",
            "label": "Osaka · ap-northeast-3"
          },
          {
            "value": "us-east-1",
            "label": "N. Virginia · us-east-1"
          },
          {
            "value": "us-east-2",
            "label": "Ohio · us-east-2"
          },
          {
            "value": "us-west-1",
            "label": "N. California · us-west-1"
          },
          {
            "value": "us-west-2",
            "label": "Oregon · us-west-2"
          }
        ],
        "value": "ap-northeast-1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "project-hours",
        "label": "共通 月間時間",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "730",
        "options": null,
        "value": "730",
        "visible": true,
        "invalid": null
      },
      {
        "id": "scheduler-free-remaining",
        "label": "Schedulerの残り無料枠 (回/月)",
        "type": "number",
        "min": "0",
        "max": "14000000",
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "14000000",
        "options": null,
        "value": "14000000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-profile",
        "label": "利用方式\nAmazon Athena",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
        "options": [
          {
            "value": "standard",
            "label": "Amazon Athena"
          }
        ],
        "value": "standard",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-region",
        "label": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "inherit",
        "options": [
          {
            "value": "inherit",
            "label": "プロジェクトのリージョンを継承"
          },
          {
            "value": "ap-northeast-1",
            "label": "アジアパシフィック (東京) に変更"
          }
        ],
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-queriesPerMonth",
        "label": "クエリの合計数 (件/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sqlPeriod",
        "label": "クエリの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "month",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-scannedGbPerQuery",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-dpus",
        "label": "DPU の数",
        "type": "number",
        "min": "4",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-activeHours",
        "label": "キャパシティがアクティブである期間 (時間/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-spark-sessionsPerMonth",
        "label": "スパークセッションの合計数 (件/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sparkPeriod",
        "label": "スパークセッションの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "month",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-spark-dpuHoursPerSession",
        "label": "セッションあたりのコード実行 (DPU 時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAmazon Athena\n行名を編集\n\t\nAmazon Athena\nsqlPeriod: month · sparkPeriod: month · queriesPerMonth: 0 · scannedGbPerQuery: 0 · queriesPerMonth: 0 · scannedGbPerQuery: 0 · queriesPerMonth: 10 · scannedGbPerQuery: 1 · dpus: 4 · activeHours: 1 · sessionsPerMonth: 0 · dpuHoursPerSession: 0 · sessionsPerMonth: 0 · dpuHoursPerSession: 0 · sessionsPerMonth: 10 · dpuHoursPerSession: 1\n$6.77\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$6.77\nBaselineとの差額: $0.00\nAmazon Athena\n×\n\nPricing Limitationあり\n\n利用方式\nAmazon Athena\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nクエリごとの料金が設定された SQL クエリ\nクエリの合計数 (件/月)\nクエリの合計数のユニット\nday\nweek\nmonth\nクエリごとにスキャンされるデータ量 (GB)\n$0.05\nキャパシティベースの料金が設定された SQL クエリ\nDPU の数\nキャパシティがアクティブである期間 (時間/月)\n$1.72\nスパーク\nスパークセッションの合計数 (件/月)\nスパークセッションの合計数のユニット\nday\nweek\nmonth\nセッションあたりのコード実行 (DPU 時間)\n$5.00\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "sql-scanned",
        "title": "クエリごとの料金が設定された SQL クエリ",
        "monthly": "$0.05"
      },
      {
        "id": "capacity",
        "title": "キャパシティベースの料金が設定された SQL クエリ",
        "monthly": "$1.72"
      },
      {
        "id": "spark",
        "title": "スパーク",
        "monthly": "$5.00"
      }
    ],
    "screen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-baseline-1791955201502-local.png",
    "totalScreen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-baseline-1791955201502-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$6.77",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsBefore": {
    "observedAt": "2026-10-14T05:20:35.075Z",
    "url": "https://calculator.aws/#/createCalculator/Athena",
    "monthlyDisplay": "6.77",
    "monthlyUsd": "6.77",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "6.77",
      "6.77"
    ],
    "inputs": [
      {
        "id": "formField92-1791955211735-4100",
        "label": "Description - optional",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField94-1791955211738-2266",
        "label": "Choose a location typeInfo",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Region",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField107-1791955211743-9412",
        "label": "Choose a Region",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Asia Pacific (Tokyo)",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField149-1791955211891-3314",
        "label": "Total number of queries Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField151-1791955211891-7139",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField161-1791955211892-9965",
        "label": "Amount of data scanned per query Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791955211893-8543",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField174-1791955211895-2942",
        "label": "Number of DPUs Enter amount",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField177-1791955211897-4821",
        "label": "Length of time capacity is active Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField179-1791955211897-2208",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "hours per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField197-1791955211901-7764",
        "label": "Total number of spark sessions Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField199-1791955211901-1970",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField209-1791955211902-8944",
        "label": "Code execution per session Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField211-1791955211902-1279",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "DPU-hour",
        "visible": true,
        "invalid": null
      }
    ],
    "warnings": [
      "A single Data Processing Unit (DPU) typically provides 4 vCPU and 16 GB of memory. Minimum of 4 DPUs per Capacity Reservation and minimum increment of 4 DPUs.",
      "Minimum billed duration per Capacity Reservation is 1 minute."
    ],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Amazon Athena\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nSQL Queries\nInfo\nSQL queries with per query pricing\nWith per query pricing, you pay only for the queries you run. To estimate your monthly cost, enter the total number of queries you expect to run in a day, week, or month and the amount of data scanned per query.\nTotal number of queries\nUnit\nper month\nAmount of data scanned per query\nUnit\nGB\nSQL queries with capacity based pricing\nWith capacity based pricing, you can pay an hourly price for compute resources to run your queries. You pay only for the capacity you need, measured in Data Processing Units (DPUs), and the time capacity is active in your account. To estimate your monthly cost, enter the number of DPUs and time needed.\nNumber of DPUs\nA single Data Processing Unit (DPU) typically provides 4 vCPU and 16 GB of memory. Minimum of 4 DPUs per Capacity Reservation and minimum increment of 4 DPUs.\nLength of time capacity is active\nMinimum billed duration per Capacity Reservation is 1 minute.\nValue\nUnit\nhours per month\nShow calculations\nUnit conversions\nAmount of data scanned per query: 1 GB x 0.0009765625 TB in a GB = 0.0009765625 TB\nPricing calculations\nRounding (10) = 10 Rounded total number of queries\n10 queries per month x 0.0009765625 TB x 5.00 USD = 0.05 USD\nSQL queries with per query cost (monthly): 0.05 USD\nRoundUp (4) = 4 DPUs (increments of 4)\n4 DPUs x 1 hours per month x 0.43 USD per DPU hour = 1.72 USD\nSQL queries with capacity based cost (monthly): 1.72 USD\n0.05 USD monthly queries cost + 1.72 USD monthly DPUs cost = 1.77 USD\nTotal SQL queries cost (monthly): 1.77 USD\nSpark\nInfo\nFor Spark executions, enter the number of sessions you expect to run in a day, week, or month and the number of DPU-hours each session takes.\nTotal number of spark sessions\nUnit\nper month\nCode execution per session\nUnit\nDPU-hour\nShow calculations\nRounding (10) = 10 Rounded total number of spark sessions\n10 spark sessions per month x 1 DPU-hour x 0.50 USD per DPU-hour = 5.00 USD\nTotal spark execution cost (monthly): 5.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 6.77 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-baseline-1791955201502-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "localAfter": {
    "observedAt": "2026-10-14T05:20:37.035Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$8.18",
    "monthlyUsd": "8.18",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "8.18",
      "8.18"
    ],
    "inputs": [
      {
        "id": "project-region",
        "label": "Region\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "ap-northeast-1",
        "options": [
          {
            "value": "ap-northeast-1",
            "label": "Tokyo · ap-northeast-1"
          },
          {
            "value": "ap-northeast-3",
            "label": "Osaka · ap-northeast-3"
          },
          {
            "value": "us-east-1",
            "label": "N. Virginia · us-east-1"
          },
          {
            "value": "us-east-2",
            "label": "Ohio · us-east-2"
          },
          {
            "value": "us-west-1",
            "label": "N. California · us-west-1"
          },
          {
            "value": "us-west-2",
            "label": "Oregon · us-west-2"
          }
        ],
        "value": "ap-northeast-1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "project-hours",
        "label": "共通 月間時間",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "730",
        "options": null,
        "value": "730",
        "visible": true,
        "invalid": null
      },
      {
        "id": "scheduler-free-remaining",
        "label": "Schedulerの残り無料枠 (回/月)",
        "type": "number",
        "min": "0",
        "max": "14000000",
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "14000000",
        "options": null,
        "value": "14000000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-profile",
        "label": "利用方式\nAmazon Athena",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
        "options": [
          {
            "value": "standard",
            "label": "Amazon Athena"
          }
        ],
        "value": "standard",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-region",
        "label": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "inherit",
        "options": [
          {
            "value": "inherit",
            "label": "プロジェクトのリージョンを継承"
          },
          {
            "value": "ap-northeast-1",
            "label": "アジアパシフィック (東京) に変更"
          }
        ],
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-day-queriesPerMonth",
        "label": "クエリの合計数 (件/日)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sqlPeriod",
        "label": "クエリの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "day",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "day",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-day-scannedGbPerQuery",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-dpus",
        "label": "DPU の数",
        "type": "number",
        "min": "4",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-activeHours",
        "label": "キャパシティがアクティブである期間 (時間/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-spark-sessionsPerMonth",
        "label": "スパークセッションの合計数 (件/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sparkPeriod",
        "label": "スパークセッションの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "month",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-spark-dpuHoursPerSession",
        "label": "セッションあたりのコード実行 (DPU 時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAmazon Athena\n行名を編集\n\t\nAmazon Athena\nsqlPeriod: day · sparkPeriod: month · queriesPerMonth: 10 · scannedGbPerQuery: 1 · queriesPerMonth: 0 · scannedGbPerQuery: 0 · queriesPerMonth: 10 · scannedGbPerQuery: 1 · dpus: 4 · activeHours: 1 · sessionsPerMonth: 0 · dpuHoursPerSession: 0 · sessionsPerMonth: 0 · dpuHoursPerSession: 0 · sessionsPerMonth: 10 · dpuHoursPerSession: 1\n$8.18\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$8.18\nBaselineとの差額: $0.00\nAmazon Athena\n×\n\nPricing Limitationあり\n\n利用方式\nAmazon Athena\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nクエリごとの料金が設定された SQL クエリ\nクエリの合計数 (件/日)\nクエリの合計数のユニット\nday\nweek\nmonth\nクエリごとにスキャンされるデータ量 (GB)\n$1.46\nキャパシティベースの料金が設定された SQL クエリ\nDPU の数\nキャパシティがアクティブである期間 (時間/月)\n$1.72\nスパーク\nスパークセッションの合計数 (件/月)\nスパークセッションの合計数のユニット\nday\nweek\nmonth\nセッションあたりのコード実行 (DPU 時間)\n$5.00\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "sql-scanned-day",
        "title": "クエリごとの料金が設定された SQL クエリ",
        "monthly": "$1.46"
      },
      {
        "id": "capacity",
        "title": "キャパシティベースの料金が設定された SQL クエリ",
        "monthly": "$1.72"
      },
      {
        "id": "spark",
        "title": "スパーク",
        "monthly": "$5.00"
      }
    ],
    "screen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-after-1791955201502-local.png",
    "totalScreen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-after-1791955201502-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$8.18",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsAfter": {
    "observedAt": "2026-10-14T05:20:38.811Z",
    "url": "https://calculator.aws/#/createCalculator/Athena",
    "monthlyDisplay": "8.20",
    "monthlyUsd": "8.20",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "8.20",
      "8.20"
    ],
    "inputs": [
      {
        "id": "formField92-1791955211735-4100",
        "label": "Description - optional",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField94-1791955211738-2266",
        "label": "Choose a location typeInfo",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Region",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField107-1791955211743-9412",
        "label": "Choose a Region",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Asia Pacific (Tokyo)",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField149-1791955211891-3314",
        "label": "Total number of queries Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField151-1791955211891-7139",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per day",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField161-1791955211892-9965",
        "label": "Amount of data scanned per query Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791955211893-8543",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField174-1791955211895-2942",
        "label": "Number of DPUs Enter amount",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField177-1791955211897-4821",
        "label": "Length of time capacity is active Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField179-1791955211897-2208",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "hours per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField197-1791955211901-7764",
        "label": "Total number of spark sessions Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField199-1791955211901-1970",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField209-1791955211902-8944",
        "label": "Code execution per session Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField211-1791955211902-1279",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "DPU-hour",
        "visible": true,
        "invalid": null
      }
    ],
    "warnings": [
      "A single Data Processing Unit (DPU) typically provides 4 vCPU and 16 GB of memory. Minimum of 4 DPUs per Capacity Reservation and minimum increment of 4 DPUs.",
      "Minimum billed duration per Capacity Reservation is 1 minute."
    ],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Amazon Athena\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nSQL Queries\nInfo\nSQL queries with per query pricing\nWith per query pricing, you pay only for the queries you run. To estimate your monthly cost, enter the total number of queries you expect to run in a day, week, or month and the amount of data scanned per query.\nTotal number of queries\nUnit\nper day\nAmount of data scanned per query\nUnit\nGB\nSQL queries with capacity based pricing\nWith capacity based pricing, you can pay an hourly price for compute resources to run your queries. You pay only for the capacity you need, measured in Data Processing Units (DPUs), and the time capacity is active in your account. To estimate your monthly cost, enter the number of DPUs and time needed.\nNumber of DPUs\nA single Data Processing Unit (DPU) typically provides 4 vCPU and 16 GB of memory. Minimum of 4 DPUs per Capacity Reservation and minimum increment of 4 DPUs.\nLength of time capacity is active\nMinimum billed duration per Capacity Reservation is 1 minute.\nValue\nUnit\nhours per month\nShow calculations\nUnit conversions\nTotal number of queries: 10 per day * (730 hours in a month / 24 hours in a day) = 304.17 queries per month\nAmount of data scanned per query: 1 GB x 0.0009765625 TB in a GB = 0.0009765625 TB\nPricing calculations\nRounding (304.17) = 304 Rounded total number of queries\n304 queries per month x 0.0009765625 TB x 5.00 USD = 1.48 USD\nSQL queries with per query cost (monthly): 1.48 USD\nRoundUp (4) = 4 DPUs (increments of 4)\n4 DPUs x 1 hours per month x 0.43 USD per DPU hour = 1.72 USD\nSQL queries with capacity based cost (monthly): 1.72 USD\n1.48 USD monthly queries cost + 1.72 USD monthly DPUs cost = 3.20 USD\nTotal SQL queries cost (monthly): 3.20 USD\nSpark\nInfo\nFor Spark executions, enter the number of sessions you expect to run in a day, week, or month and the number of DPU-hours each session takes.\nTotal number of spark sessions\nUnit\nper month\nCode execution per session\nUnit\nDPU-hour\nShow calculations\nRounding (10) = 10 Rounded total number of spark sessions\n10 spark sessions per month x 1 DPU-hour x 0.50 USD per DPU-hour = 5.00 USD\nTotal spark execution cost (monthly): 5.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 8.20 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal-after-1791955201502-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "publicBuildId": "20261013T095030Z-78197541",
  "localDeltaUsd": "1.41",
  "awsDeltaUsd": "1.43",
  "beforeDifferenceUsd": "0",
  "afterDifferenceUsd": "-0.02",
  "deltaDifferenceUsd": "-0.02",
  "reason": "Configured inputs produced a total or delta difference above $0.01; investigate math and equivalence before attributing root cause.",
  "equivalence": {
    "sqlPeriod": "month",
    "sparkPeriod": "month",
    "dataUnit": "GB",
    "capacityUnit": "hours/month",
    "sparkDpuUnit": "DPU-hour"
  },
  "invalidGuiInputs": [],
  "effectiveBaseline": {
    "local": [
      {
        "id": "project-region",
        "label": "Region\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "ap-northeast-1",
        "options": [
          {
            "value": "ap-northeast-1",
            "label": "Tokyo · ap-northeast-1"
          },
          {
            "value": "ap-northeast-3",
            "label": "Osaka · ap-northeast-3"
          },
          {
            "value": "us-east-1",
            "label": "N. Virginia · us-east-1"
          },
          {
            "value": "us-east-2",
            "label": "Ohio · us-east-2"
          },
          {
            "value": "us-west-1",
            "label": "N. California · us-west-1"
          },
          {
            "value": "us-west-2",
            "label": "Oregon · us-west-2"
          }
        ],
        "value": "ap-northeast-1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "project-hours",
        "label": "共通 月間時間",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "730",
        "options": null,
        "value": "730",
        "visible": true,
        "invalid": null
      },
      {
        "id": "scheduler-free-remaining",
        "label": "Schedulerの残り無料枠 (回/月)",
        "type": "number",
        "min": "0",
        "max": "14000000",
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "14000000",
        "options": null,
        "value": "14000000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-profile",
        "label": "利用方式\nAmazon Athena",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
        "options": [
          {
            "value": "standard",
            "label": "Amazon Athena"
          }
        ],
        "value": "standard",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-region",
        "label": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "inherit",
        "options": [
          {
            "value": "inherit",
            "label": "プロジェクトのリージョンを継承"
          },
          {
            "value": "ap-northeast-1",
            "label": "アジアパシフィック (東京) に変更"
          }
        ],
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-queriesPerMonth",
        "label": "クエリの合計数 (件/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sqlPeriod",
        "label": "クエリの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "month",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-sql-scanned-scannedGbPerQuery",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-dpus",
        "label": "DPU の数",
        "type": "number",
        "min": "4",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-capacity-activeHours",
        "label": "キャパシティがアクティブである期間 (時間/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-spark-sessionsPerMonth",
        "label": "スパークセッションの合計数 (件/月)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "1",
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--sparkPeriod",
        "label": "スパークセッションの合計数のユニット\nday\nweek\nmonth",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "month",
        "options": [
          {
            "value": "day",
            "label": "day"
          },
          {
            "value": "week",
            "label": "week"
          },
          {
            "value": "month",
            "label": "month"
          }
        ],
        "value": "month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-spark-dpuHoursPerSession",
        "label": "セッションあたりのコード実行 (DPU 時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": "false"
      }
    ],
    "aws": [
      {
        "id": "formField92-1791955211735-4100",
        "label": "Description - optional",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField94-1791955211738-2266",
        "label": "Choose a location typeInfo",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Region",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField107-1791955211743-9412",
        "label": "Choose a Region",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Asia Pacific (Tokyo)",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField149-1791955211891-3314",
        "label": "Total number of queries Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField151-1791955211891-7139",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField161-1791955211892-9965",
        "label": "Amount of data scanned per query Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791955211893-8543",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField174-1791955211895-2942",
        "label": "Number of DPUs Enter amount",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField177-1791955211897-4821",
        "label": "Length of time capacity is active Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField179-1791955211897-2208",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "hours per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField197-1791955211901-7764",
        "label": "Total number of spark sessions Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "10",
        "options": null,
        "value": "10",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField199-1791955211901-1970",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "per month",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField209-1791955211902-8944",
        "label": "Code execution per session Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField211-1791955211902-1279",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "DPU-hour",
        "visible": true,
        "invalid": null
      }
    ]
  },
  "measurementVerdict": "FAIL",
  "guiInputApplicationChecks": [
    {
      "label": "Total number of queries Value",
      "desired": "10",
      "rendered": "10",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Amount of data scanned per query Value",
      "desired": "1",
      "rendered": "1",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Number of DPUs Enter amount",
      "desired": "4",
      "rendered": "4",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Length of time capacity is active Value",
      "desired": "1",
      "rendered": "1",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Total number of spark sessions Value",
      "desired": "10",
      "rendered": "10",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Code execution per session Value",
      "desired": "1",
      "rendered": "1",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    }
  ],
  "finishedAt": "2026-10-14T05:20:38.813Z",
  "previousAttemptEvidence": "attempts/athena-standard-ap-northeast-1-input-profile--sqlPeriod-delta-athena-period-day-signal/20261014T050502603.json",
  "previousAttempts": [
    {
      "startedAt": "2026-10-14T03:48:50.730Z",
      "reason": "Configured inputs produced a total or delta difference above $0.01; investigate math and equivalence before attributing root cause."
    },
    {
      "startedAt": "2026-10-14T05:05:02.603Z",
      "reason": "locator.innerText: Timeout 7000ms exceeded.\nCall log:\n\u001b[2m  - waiting for locator('button[aria-haspopup=\"listbox\"]:visible').filter({ hasText: 'minutes per month' }).first()\u001b[22m\n"
    }
  ],
  "componentComparisons": [
    {
      "when": "Before",
      "localComponentIds": [
        "sql-scanned",
        "sql-scanned-day",
        "sql-scanned-week"
      ],
      "localDisplayedCosts": [
        "$0.05"
      ],
      "localDisplayIntervalUsd": [
        "0.05",
        "0.05"
      ],
      "officialDisplayedLine": "SQL queries with per query cost (monthly): 0.05 USD",
      "officialDisplayUsd": "0.05",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "capacity"
      ],
      "localDisplayedCosts": [
        "$1.72"
      ],
      "localDisplayIntervalUsd": [
        "1.72",
        "1.72"
      ],
      "officialDisplayedLine": "SQL queries with capacity based cost (monthly): 1.72 USD",
      "officialDisplayUsd": "1.72",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "spark",
        "spark-day",
        "spark-week"
      ],
      "localDisplayedCosts": [
        "$5.00"
      ],
      "localDisplayIntervalUsd": [
        "5.00",
        "5.00"
      ],
      "officialDisplayedLine": "Total spark execution cost (monthly): 5.00 USD",
      "officialDisplayUsd": "5.00",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "sql-scanned",
        "sql-scanned-day",
        "sql-scanned-week"
      ],
      "localDisplayedCosts": [
        "$1.46"
      ],
      "localDisplayIntervalUsd": [
        "1.46",
        "1.46"
      ],
      "officialDisplayedLine": "SQL queries with per query cost (monthly): 1.48 USD",
      "officialDisplayUsd": "1.48",
      "distanceUsd": "0.02",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "capacity"
      ],
      "localDisplayedCosts": [
        "$1.72"
      ],
      "localDisplayIntervalUsd": [
        "1.72",
        "1.72"
      ],
      "officialDisplayedLine": "SQL queries with capacity based cost (monthly): 1.72 USD",
      "officialDisplayUsd": "1.72",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "spark",
        "spark-day",
        "spark-week"
      ],
      "localDisplayedCosts": [
        "$5.00"
      ],
      "localDisplayIntervalUsd": [
        "5.00",
        "5.00"
      ],
      "officialDisplayedLine": "Total spark execution cost (monthly): 5.00 USD",
      "officialDisplayUsd": "5.00",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    }
  ],
  "componentComparisonComplete": true,
  "totalComparisonVerdict": "FAIL",
  "equalityKind": "ROUNDING_TOLERANCE",
  "directionComparison": {
    "local": "increase",
    "official": "increase"
  },
  "observedInputChanges": {
    "local": [
      {
        "key": "input-component-sql-scanned-day-queriesPerMonth|0",
        "label": "クエリの合計数 (件/日)",
        "id": "input-component-sql-scanned-day-queriesPerMonth",
        "before": null,
        "after": "10",
        "added": true
      },
      {
        "key": "input-profile--sqlPeriod|0",
        "label": "クエリの合計数のユニット\nday\nweek\nmonth",
        "id": "input-profile--sqlPeriod",
        "before": "month",
        "after": "day",
        "added": false
      },
      {
        "key": "input-component-sql-scanned-day-scannedGbPerQuery|0",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "id": "input-component-sql-scanned-day-scannedGbPerQuery",
        "before": null,
        "after": "1",
        "added": true
      },
      {
        "key": "input-component-sql-scanned-queriesPerMonth|0",
        "label": "クエリの合計数 (件/月)",
        "id": "input-component-sql-scanned-queriesPerMonth",
        "before": "10",
        "after": null,
        "removed": true
      },
      {
        "key": "input-component-sql-scanned-scannedGbPerQuery|0",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "id": "input-component-sql-scanned-scannedGbPerQuery",
        "before": "1",
        "after": null,
        "removed": true
      }
    ],
    "aws": [
      {
        "key": "Unit|button|0",
        "label": "Unit",
        "id": "formField151-1791955211891-7139",
        "before": "per month",
        "after": "per day",
        "added": false
      }
    ]
  },
  "selectedInstanceConsistency": {
    "before": [],
    "after": [],
    "targetChangesInstanceType": false,
    "unchanged": true
  },
  "pagesCommitSha": "b51df2118aee65f2631db653e3bd01df56da091a",
  "officialFieldIds": [
    "athena:aws:Total-number-of-queries-Value-Unit-button-0-76ec33b61e"
  ],
  "localFieldIds": [
    "athena:input-profile--sqlPeriod"
  ],
  "inputMetadataLimitation": "Both selectors offer day/week/month, but current-run GUI period deltas differ. For Spark day, public monthly component is 150.00 USD while native shows 10/day × (730/24) = 304.17 sessions/month, then 304 × 1 DPU-hour × 0.50 = 152.00 USD. Read-only deployed-source investigation confirms public day conversion 30 and week conversion 52/12, and onboarding records parity check as outstanding. These differing calendar transforms are not approved by the top-level parity specification. Supported month-mode pricing remains a separate comparison.",
  "warningsAndLimitations": [
    "Input metadata and complete service parity not certified by a pricing PASS."
  ]
}
```
