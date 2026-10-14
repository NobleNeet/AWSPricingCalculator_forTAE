# athena-missing-athena-input-profile-sqlPeriod-0ec91f04aa 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: athena。Profile: {"local": "standard", "official": {"variant": "default", "requestedRegion": null, "region": "us-east-2", "regionDisplay": "US East (Ohio)"}}。Region: {"local": "ap-northeast-1", "official": "us-east-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/Athena。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: Both selectors offer day/week/month, but current-run GUI period deltas differ. For Spark day, public monthly component is 150.00 USD while native shows 10/day × (730/24) = 304.17 sessions/month, then 304 × 1 DPU-hour × 0.50 = 152.00 USD. Read-only deployed-source investigation confirms public day conversion 30 and week conversion 52/12, and onboarding records parity check as outstanding. These differing calendar transforms are not approved by the top-level parity specification. Supported month-mode pricing remains a separate comparison.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/athena/athena-missing-athena-input-profile-sqlPeriod-0ec91f04aa.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "athena-missing-athena-input-profile-sqlPeriod-0ec91f04aa",
  "serviceId": "athena",
  "profile": {
    "local": "standard",
    "official": {
      "variant": "default",
      "requestedRegion": null,
      "region": "us-east-2",
      "regionDisplay": "US East (Ohio)"
    }
  },
  "region": {
    "local": "ap-northeast-1",
    "official": "us-east-2"
  },
  "parameter": [
    "Unit",
    "クエリの合計数のユニット"
  ],
  "officialFieldIds": [
    "athena:aws:Total-number-of-queries-Value-Unit-button-0-76ec33b61e"
  ],
  "localFieldIds": [
    "athena:input-profile--sqlPeriod"
  ],
  "correspondenceRowId": "athena:input-profile--sqlPeriod",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "Both selectors offer day/week/month, but current-run GUI period deltas differ. For Spark day, public monthly component is 150.00 USD while native shows 10/day × (730/24) = 304.17 sessions/month, then 304 × 1 DPU-hour × 0.50 = 152.00 USD. Read-only deployed-source investigation confirms public day conversion 30 and week conversion 52/12, and onboarding records parity check as outstanding. These differing calendar transforms are not approved by the top-level parity specification. Supported month-mode pricing remains a separate comparison.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/Athena"
  },
  "allInputs": {
    "localObservation": "observations/local-athena-1.json",
    "officialObservation": "observations/aws-athena-1.json",
    "units": "Read full rendered labels and options in the independent observation JSON; no units inferred."
  },
  "localBefore": null,
  "localAfter": null,
  "awsBefore": null,
  "awsAfter": null,
  "localDeltaUsd": null,
  "awsDeltaUsd": null,
  "amountDifferenceUsd": null,
  "toleranceUsd": "0.01",
  "unmeasuredAmountReason": "No valid equal-input numerical comparison executed for this input row. Missing input remains an input FAIL.",
  "evidence": {
    "local": {
      "file": "observations/local-athena-1.json",
      "screen": "screenshots/local-athena-1.png",
      "condition": {
        "profile": {
          "value": "standard",
          "label": "Amazon Athena"
        },
        "region": "ap-northeast-1",
        "variant": "default",
        "requestedProfile": {
          "value": "standard",
          "label": "Amazon Athena"
        },
        "profileObservedFrom": "drawer-profile DOM value"
      },
      "visible": true,
      "value": "day",
      "domId": "input-profile--sqlPeriod"
    },
    "aws": {
      "file": "observations/aws-athena-1.json",
      "screen": "screenshots/aws-athena-1.png",
      "condition": {
        "variant": "default",
        "requestedRegion": null,
        "region": "us-east-2",
        "regionDisplay": "US East (Ohio)"
      },
      "value": "per day",
      "domId": "formField2655-1791893417456-4406",
      "section": null,
      "context": "per day"
    }
  },
  "specificationEvidence": [
    "docs/uat/AWS_CALCULATOR_PARITY.md §5.1/7",
    "docs/SERVICE_ONBOARDING.md §3.1.1",
    "services/athena/ONBOARDING.md UI/calculations and Limitations (supplemental deployed commit)"
  ],
  "resumeRequirements": [
    "Verify same public build and current AWS price assumptions",
    "Complete missing parent-condition inventory",
    "Configure an independent equivalent estimate in both real GUIs",
    "Measure baseline and changed monthly totals and components"
  ],
  "correspondenceClassification": "MISMATCHED",
  "candidateComparison": {
    "observedOfficialOptions": [
      {
        "label": "per day",
        "disabled": null
      },
      {
        "label": "per week",
        "disabled": null
      },
      {
        "label": "per month",
        "disabled": null
      },
      {
        "label": "per day\nper day",
        "disabled": null
      }
    ],
    "observedLocalOptions": [
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
    "limitation": "Source investigation is supplemental, not expected-price generation. Use each SQL/Spark period case own raw totals and official lines; Spark amounts above do not represent SQL prices. Investigate usage transforms and native whole-count truncation rather than assume a unit-price defect or introduce intermediate monetary rounding."
  },
  "renderedInputs": {
    "local": [
      {
        "domId": "drawer-profile",
        "index": 0,
        "tag": "SELECT",
        "type": "select-one",
        "label": "利用方式\nAmazon Athena",
        "value": "standard",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": [
          {
            "value": "standard",
            "label": "Amazon Athena"
          }
        ],
        "context": "利用方式\nAmazon Athena"
      },
      {
        "domId": "drawer-region",
        "index": 1,
        "tag": "SELECT",
        "type": "select-one",
        "label": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更",
        "value": "inherit",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
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
        "context": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更"
      },
      {
        "domId": "input-component-sql-scanned-day-queriesPerMonth",
        "index": 2,
        "tag": "INPUT",
        "type": "number",
        "label": "クエリの合計数 (件/日)",
        "value": "0",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "1",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "クエリの合計数 (件/日)"
      },
      {
        "domId": "input-profile--sqlPeriod",
        "index": 3,
        "tag": "SELECT",
        "type": "select-one",
        "label": "クエリの合計数のユニット\nday\nweek\nmonth",
        "value": "day",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
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
        "context": "クエリの合計数のユニット\nday\nweek\nmonth"
      },
      {
        "domId": "input-component-sql-scanned-day-scannedGbPerQuery",
        "index": 4,
        "tag": "INPUT",
        "type": "number",
        "label": "クエリごとにスキャンされるデータ量 (GB)",
        "value": "0",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "クエリごとにスキャンされるデータ量 (GB)"
      },
      {
        "domId": "input-component-capacity-dpus",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "DPU の数",
        "value": "4",
        "visible": true,
        "disabled": false,
        "min": "4",
        "max": null,
        "step": "1",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "DPU の数"
      },
      {
        "domId": "input-component-capacity-activeHours",
        "index": 6,
        "tag": "INPUT",
        "type": "number",
        "label": "キャパシティがアクティブである期間 (時間/月)",
        "value": "0",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "キャパシティがアクティブである期間 (時間/月)"
      },
      {
        "domId": "input-component-spark-day-sessionsPerMonth",
        "index": 7,
        "tag": "INPUT",
        "type": "number",
        "label": "スパークセッションの合計数 (件/日)",
        "value": "0",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "1",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "スパークセッションの合計数 (件/日)"
      },
      {
        "domId": "input-profile--sparkPeriod",
        "index": 8,
        "tag": "SELECT",
        "type": "select-one",
        "label": "スパークセッションの合計数のユニット\nday\nweek\nmonth",
        "value": "day",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
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
        "context": "スパークセッションの合計数のユニット\nday\nweek\nmonth"
      },
      {
        "domId": "input-component-spark-day-dpuHoursPerSession",
        "index": 9,
        "tag": "INPUT",
        "type": "number",
        "label": "セッションあたりのコード実行 (DPU 時間)",
        "value": "0",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "セッションあたりのコード実行 (DPU 時間)"
      }
    ],
    "official": [
      {
        "domId": "formField2596-1791893417317-3286",
        "index": 0,
        "tag": "INPUT",
        "type": "text",
        "label": "Description - optional",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2598-1791893417318-751",
        "index": 1,
        "tag": "BUTTON",
        "type": "button",
        "label": "Choose a location typeInfo",
        "value": "Region",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Region"
      },
      {
        "domId": "formField2611-1791893417319-5423",
        "index": 2,
        "tag": "BUTTON",
        "type": "button",
        "label": "Choose a Region",
        "value": "US East (Ohio)",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "US East (Ohio)"
      },
      {
        "domId": "formField2653-1791893417456-7563",
        "index": 3,
        "tag": "INPUT",
        "type": "number",
        "label": "Total number of queries Value",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2655-1791893417456-4406",
        "index": 4,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "per day",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "per day"
      },
      {
        "domId": "formField2665-1791893417458-2725",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "Amount of data scanned per query Value",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2667-1791893417458-1589",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "GB",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "GB"
      },
      {
        "domId": "formField2678-1791893417460-7757",
        "index": 7,
        "tag": "INPUT",
        "type": "text",
        "label": "Number of DPUs Enter amount",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2681-1791893417461-7646",
        "index": 8,
        "tag": "INPUT",
        "type": "number",
        "label": "Length of time capacity is active Value",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2683-1791893417462-8923",
        "index": 9,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "hours per month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "hours per month"
      },
      {
        "domId": "formField2701-1791893417465-4613",
        "index": 10,
        "tag": "INPUT",
        "type": "number",
        "label": "Total number of spark sessions Value",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2703-1791893417465-1343",
        "index": 11,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "per day",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "per day"
      },
      {
        "domId": "formField2713-1791893417466-7544",
        "index": 12,
        "tag": "INPUT",
        "type": "number",
        "label": "Code execution per session Value",
        "value": "",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2715-1791893417466-6977",
        "index": 13,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "DPU-hour",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "DPU-hour"
      }
    ]
  },
  "severity": "HIGH"
}
```
