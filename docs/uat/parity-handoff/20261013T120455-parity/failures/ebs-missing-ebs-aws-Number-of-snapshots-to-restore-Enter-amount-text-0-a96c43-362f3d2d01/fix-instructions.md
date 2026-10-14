# ebs-missing-ebs-aws-Number-of-snapshots-to-restore-Enter-amount-text-0-a96c43-362f3d2d01 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: ebs。Profile: {"local": "standard", "official": {"variant": "default", "requestedRegion": null, "region": "us-east-2", "regionDisplay": "US East (Ohio)"}}。Region: {"local": "us-east-2", "official": "us-east-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/EBS。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/ebs/ebs-missing-ebs-aws-Number-of-snapshots-to-restore-Enter-amount-text-0-a96c43-362f3d2d01.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "ebs-missing-ebs-aws-Number-of-snapshots-to-restore-Enter-amount-text-0-a96c43-362f3d2d01",
  "serviceId": "ebs",
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
    "local": "us-east-2",
    "official": "us-east-2"
  },
  "parameter": [
    "Number of snapshots to restore Enter amount"
  ],
  "officialFieldIds": [
    "ebs:aws:Number-of-snapshots-to-restore-Enter-amount-text-0-a96c43c831"
  ],
  "localFieldIds": [],
  "correspondenceRowId": "ebs:aws:Number-of-snapshots-to-restore-Enter-amount-text-0-a96c43c831",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/EBS"
  },
  "allInputs": {
    "localObservation": "observations/local-ebs-209.json",
    "officialObservation": "observations/aws-ebs-7.json",
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
      "file": "observations/local-ebs-209.json",
      "screen": "screenshots/local-ebs-209.png",
      "condition": {
        "profile": {
          "value": "standard",
          "label": "標準"
        },
        "region": "us-east-2",
        "variant": "region",
        "requestedProfile": {
          "value": "standard",
          "label": "標準"
        },
        "profileObservedFrom": "drawer-profile DOM value"
      }
    },
    "aws": {
      "file": "observations/aws-ebs-7.json",
      "screen": "screenshots/aws-ebs-7.png",
      "condition": {
        "variant": "default",
        "requestedRegion": null,
        "region": "us-east-2",
        "regionDisplay": "US East (Ohio)"
      },
      "value": "",
      "domId": "formField3342-1791893496876-80",
      "section": null,
      "context": ""
    }
  },
  "specificationEvidence": [
    "docs/uat/AWS_CALCULATOR_PARITY.md §5.1",
    "docs/SERVICE_ONBOARDING.md §5–6"
  ],
  "resumeRequirements": [
    "Verify same public build and current AWS price assumptions",
    "Complete missing parent-condition inventory",
    "Configure an independent equivalent estimate in both real GUIs",
    "Measure baseline and changed monthly totals and components"
  ],
  "correspondenceClassification": "MISSING_LOCAL",
  "candidateComparison": {},
  "renderedInputs": {
    "local": [
      {
        "domId": "drawer-profile",
        "index": 0,
        "tag": "SELECT",
        "type": "select-one",
        "label": "利用方式\n標準",
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
            "label": "標準"
          }
        ],
        "context": "利用方式\n標準",
        "section": "料金見積もりの制約"
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
        "context": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-profile--volume",
        "index": 2,
        "tag": "SELECT",
        "type": "select-one",
        "label": "各 EC2 インスタンスのストレージ\ngp2\ngp3",
        "value": "gp3",
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
            "value": "gp2",
            "label": "gp2"
          },
          {
            "value": "gp3",
            "label": "gp3"
          }
        ],
        "context": "各 EC2 インスタンスのストレージ\ngp2\ngp3",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-storage-gbMonths",
        "index": 3,
        "tag": "INPUT",
        "type": "number",
        "label": "ストレージ量 (GB/月)",
        "value": "100",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "ストレージ量 (GB/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-iops-iopsMonths",
        "index": 4,
        "tag": "INPUT",
        "type": "number",
        "label": "基本料金に含まれる分を超える有料 IOPS (IOPS/月)",
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
        "context": "基本料金に含まれる分を超える有料 IOPS (IOPS/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-throughput-mibpsMonths",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "基本料金に含まれる分を超える有料スループット (MiB/s/月)",
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
        "context": "基本料金に含まれる分を超える有料スループット (MiB/s/月)",
        "section": "料金見積もりの制約"
      }
    ],
    "official": [
      {
        "domId": "formField3274-1791893496771-4809",
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
        "domId": "formField3276-1791893496772-2800",
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
        "domId": "formField3289-1791893496773-4695",
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
        "domId": "formField3309-1791893496871-6383",
        "index": 3,
        "tag": "INPUT",
        "type": "text",
        "label": "Number of volumes Enter amount",
        "value": "1",
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
        "domId": "formField3311-1791893496871-8760",
        "index": 4,
        "tag": "INPUT",
        "type": "number",
        "label": "Average duration of volume Value",
        "value": "730",
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
        "domId": "formField3313-1791893496872-9312",
        "index": 5,
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
        "domId": "formField3390-1791893496905-4196",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Storage for each EC2 instance",
        "value": "General Purpose SSD (gp2)",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "General Purpose SSD (gp2)"
      },
      {
        "domId": "formField3323-1791893496873-667",
        "index": 7,
        "tag": "INPUT",
        "type": "number",
        "label": "Storage amount per volume Value",
        "value": "30",
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
        "domId": "formField3325-1791893496874-2744",
        "index": 8,
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
        "domId": "formField3402-1791893496908-3730",
        "index": 9,
        "tag": "BUTTON",
        "type": "button",
        "label": "Snapshot Frequency",
        "value": "2x Daily",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "2x Daily"
      },
      {
        "domId": "formField3412-1791893496909-4051",
        "index": 10,
        "tag": "INPUT",
        "type": "number",
        "label": "Amount changed per snapshot Value",
        "value": "3",
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
        "domId": "formField3414-1791893496909-4051",
        "index": 11,
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
        "domId": "formField3342-1791893496876-80",
        "index": 12,
        "tag": "INPUT",
        "type": "text",
        "label": "Number of snapshots to restore Enter amount",
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
        "domId": "formField3352-1791893496877-8423",
        "index": 13,
        "tag": "INPUT",
        "type": "number",
        "label": "Number of GetSnapshotBlock API requests Value",
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
        "domId": "formField3354-1791893496877-1327",
        "index": 14,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "Thousand Snapshot API units per month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Thousand Snapshot API units per month"
      },
      {
        "domId": "formField3365-1791893496878-8009",
        "index": 15,
        "tag": "INPUT",
        "type": "number",
        "label": "Number of LIST API requests Value",
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
        "domId": "formField3367-1791893496878-1864",
        "index": 16,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "thousand requests per month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "thousand requests per month"
      },
      {
        "domId": "formField3378-1791893496879-3578",
        "index": 17,
        "tag": "INPUT",
        "type": "number",
        "label": "Number of PutSnapshotBlock API requests Value",
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
        "domId": "formField3380-1791893496880-307",
        "index": 18,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "Thousand Snapshot API units per month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Thousand Snapshot API units per month"
      }
    ]
  },
  "severity": "HIGH"
}
```
