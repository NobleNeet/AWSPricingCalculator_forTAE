# rds-missing-rds-aws-Please-choose-the-pricing-year-for-RDS-Extended-Support-P-89d5f51d92 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: rds。Profile: {"local": "standard", "official": {"variant": "default", "requestedRegion": null, "region": "us-east-2", "regionDisplay": "US East (Ohio)"}}。Region: {"local": "us-east-2", "official": "us-east-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/RDSPostgreSQL。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/rds/rds-missing-rds-aws-Please-choose-the-pricing-year-for-RDS-Extended-Support-P-89d5f51d92.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "rds-missing-rds-aws-Please-choose-the-pricing-year-for-RDS-Extended-Support-P-89d5f51d92",
  "serviceId": "rds",
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
    "Please choose the pricing year for RDS Extended Support (Pricing in year 3 is higher than the pricing in the first 2 years)"
  ],
  "officialFieldIds": [
    "rds:aws:Please-choose-the-pricing-year-for-RDS-Extended-Support-Pricing-i-bcb2a9ef34"
  ],
  "localFieldIds": [],
  "correspondenceRowId": "rds:aws:Please-choose-the-pricing-year-for-RDS-Extended-Support-Pricing-i-bcb2a9ef34",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/RDSPostgreSQL"
  },
  "allInputs": {
    "localObservation": "observations/local-rds-233.json",
    "officialObservation": "observations/aws-rds-38.json",
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
      "file": "observations/local-rds-233.json",
      "screen": "screenshots/local-rds-233.png",
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
      "file": "observations/aws-rds-38.json",
      "screen": "screenshots/aws-rds-38.png",
      "condition": {
        "variant": "default",
        "requestedRegion": null,
        "region": "us-east-2",
        "regionDisplay": "US East (Ohio)"
      },
      "value": "Year 1 and Year 2 cost",
      "domId": "formField294-1791893608424-2703",
      "section": null,
      "context": "Year 1 and Year 2 cost"
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
        "label": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nus-east-2 に変更",
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
          },
          {
            "value": "us-east-2",
            "label": "us-east-2 に変更"
          }
        ],
        "context": "リージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nus-east-2 に変更",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-profile--deployment",
        "index": 2,
        "tag": "SELECT",
        "type": "select-one",
        "label": "デプロイオプション\nSingle-AZ\nMulti-AZ",
        "value": "Single-AZ",
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
            "value": "Single-AZ",
            "label": "Single-AZ"
          },
          {
            "value": "Multi-AZ",
            "label": "Multi-AZ"
          }
        ],
        "context": "デプロイオプション\nSingle-AZ\nMulti-AZ",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-instance-instanceType",
        "index": 3,
        "tag": "SELECT",
        "type": "select-one",
        "label": "インスタンスタイプ\ndb.m4.2xlarge\ndb.m4.4xlarge\ndb.m4.10xlarge\ndb.m4.16xlarge\ndb.m4.large\ndb.m4.xlarge\ndb.m5.2xlarge\ndb.m5.4xlarge\ndb.m5.8xlarge\ndb.m5.12xlarge\ndb.m5.16xlarge\ndb.m5.24xlarge\ndb.m5.large\ndb.m5.xlarge\ndb.m5d.2xlarge\ndb.m5d.4xlarge\ndb.m5d.8xlarge\ndb.m5d.12xlarge\ndb.m5d.16xlarge\ndb.m5d.24xlarge\ndb.m5d.large\ndb.m5d.xlarge\ndb.m6g.2xlarge\ndb.m6g.4xlarge\ndb.m6g.8xlarge\ndb.m6g.12xlarge\ndb.m6g.16xlarge\ndb.m6g.large\ndb.m6g.xlarge\ndb.m6gd.2xlarge\ndb.m6gd.4xlarge\ndb.m6gd.8xlarge\ndb.m6gd.12xlarge\ndb.m6gd.16xlarge\ndb.m6gd.large\ndb.m6gd.xlarge\ndb.m6i.2xlarge\ndb.m6i.4xlarge\ndb.m6i.8xlarge\ndb.m6i.12xlarge\ndb.m6i.16xlarge\ndb.m6i.24xlarge\ndb.m6i.32xlarge\ndb.m6i.large\ndb.m6i.xlarge\ndb.m6id.2xlarge\ndb.m6id.4xlarge\ndb.m6id.8xlarge\ndb.m6id.12xlarge\ndb.m6id.16xlarge\ndb.m6id.24xlarge\ndb.m6id.32xlarge\ndb.m6id.large\ndb.m6id.xlarge\ndb.m6idn.2xlarge\ndb.m6idn.4xlarge\ndb.m6idn.8xlarge\ndb.m6idn.12xlarge\ndb.m6idn.16xlarge\ndb.m6idn.24xlarge\ndb.m6idn.32xlarge\ndb.m6idn.large\ndb.m6idn.xlarge\ndb.m6in.2xlarge\ndb.m6in.4xlarge\ndb.m6in.8xlarge\ndb.m6in.12xlarge\ndb.m6in.16xlarge\ndb.m6in.24xlarge\ndb.m6in.32xlarge\ndb.m6in.large\ndb.m6in.xlarge\ndb.m7g.2xlarge\ndb.m7g.4xlarge\ndb.m7g.8xlarge\ndb.m7g.12xlarge\ndb.m7g.16xlarge\ndb.m7g.large\ndb.m7g.xlarge\ndb.m7i.2xlarge\ndb.m7i.4xlarge\ndb.m7i.8xlarge\ndb.m7i.12xlarge\ndb.m7i.16xlarge\ndb.m7i.24xlarge\ndb.m7i.48xlarge\ndb.m7i.large\ndb.m7i.xlarge\ndb.m8a.2xlarge\ndb.m8a.4xlarge\ndb.m8a.8xlarge\ndb.m8a.12xlarge\ndb.m8a.16xlarge\ndb.m8a.24xlarge\ndb.m8a.48xlarge\ndb.m8a.large\ndb.m8a.xlarge\ndb.m8g.2xlarge\ndb.m8g.4xlarge\ndb.m8g.8xlarge\ndb.m8g.12xlarge\ndb.m8g.16xlarge\ndb.m8g.24xlarge\ndb.m8g.48xlarge\ndb.m8g.large\ndb.m8g.xlarge\ndb.m8gd.2xlarge\ndb.m8gd.4xlarge\ndb.m8gd.8xlarge\ndb.m8gd.12xlarge\ndb.m8gd.16xlarge\ndb.m8gd.24xlarge\ndb.m8gd.48xlarge\ndb.m8gd.large\ndb.m8gd.xlarge\ndb.m9g.2xlarge\ndb.m9g.4xlarge\ndb.m9g.8xlarge\ndb.m9g.12xlarge\ndb.m9g.16xlarge\ndb.m9g.24xlarge\ndb.m9g.48xlarge\ndb.m9g.large\ndb.m9g.xlarge\ndb.r3.2xlarge\ndb.r3.4xlarge\ndb.r3.8xlarge\ndb.r3.large\ndb.r3.xlarge\ndb.r4.2xlarge\ndb.r4.4xlarge\ndb.r4.8xlarge\ndb.r4.16xlarge\ndb.r4.large\ndb.r4.xlarge\ndb.r5.2xlarge\ndb.r5.4xlarge\ndb.r5.8xlarge\ndb.r5.12xlarge\ndb.r5.16xlarge\ndb.r5.24xlarge\ndb.r5.large\ndb.r5.xlarge\ndb.r5b.2xlarge\ndb.r5b.4xlarge\ndb.r5b.8xlarge\ndb.r5b.12xlarge\ndb.r5b.16xlarge\ndb.r5b.24xlarge\ndb.r5b.large\ndb.r5b.xlarge\ndb.r5d.2xlarge\ndb.r5d.4xlarge\ndb.r5d.8xlarge\ndb.r5d.12xlarge\ndb.r5d.16xlarge\ndb.r5d.24xlarge\ndb.r5d.large\ndb.r5d.xlarge\ndb.r6g.2xlarge\ndb.r6g.4xlarge\ndb.r6g.8xlarge\ndb.r6g.12xlarge\ndb.r6g.16xlarge\ndb.r6g.large\ndb.r6g.xlarge\ndb.r6gd.2xlarge\ndb.r6gd.4xlarge\ndb.r6gd.8xlarge\ndb.r6gd.12xlarge\ndb.r6gd.16xlarge\ndb.r6gd.large\ndb.r6gd.xlarge\ndb.r6i.2xlarge\ndb.r6i.4xlarge\ndb.r6i.8xlarge\ndb.r6i.12xlarge\ndb.r6i.16xlarge\ndb.r6i.24xlarge\ndb.r6i.32xlarge\ndb.r6i.large\ndb.r6i.xlarge\ndb.r6id.2xlarge\ndb.r6id.4xlarge\ndb.r6id.8xlarge\ndb.r6id.12xlarge\ndb.r6id.16xlarge\ndb.r6id.24xlarge\ndb.r6id.32xlarge\ndb.r6id.large\ndb.r6id.xlarge\ndb.r6idn.2xlarge\ndb.r6idn.4xlarge\ndb.r6idn.8xlarge\ndb.r6idn.12xlarge\ndb.r6idn.16xlarge\ndb.r6idn.24xlarge\ndb.r6idn.32xlarge\ndb.r6idn.large\ndb.r6idn.xlarge\ndb.r6in.2xlarge\ndb.r6in.4xlarge\ndb.r6in.8xlarge\ndb.r6in.12xlarge\ndb.r6in.16xlarge\ndb.r6in.24xlarge\ndb.r6in.32xlarge\ndb.r6in.large\ndb.r6in.xlarge\ndb.r7g.2xlarge\ndb.r7g.4xlarge\ndb.r7g.8xlarge\ndb.r7g.12xlarge\ndb.r7g.16xlarge\ndb.r7g.large\ndb.r7g.xlarge\ndb.r7i.2xlarge\ndb.r7i.4xlarge\ndb.r7i.8xlarge\ndb.r7i.12xlarge\ndb.r7i.16xlarge\ndb.r7i.24xlarge\ndb.r7i.48xlarge\ndb.r7i.large\ndb.r7i.xlarge\ndb.r8a.2xlarge\ndb.r8a.4xlarge\ndb.r8a.8xlarge\ndb.r8a.12xlarge\ndb.r8a.16xlarge\ndb.r8a.24xlarge\ndb.r8a.48xlarge\ndb.r8a.large\ndb.r8a.xlarge\ndb.r8g.2xlarge\ndb.r8g.4xlarge\ndb.r8g.8xlarge\ndb.r8g.12xlarge\ndb.r8g.16xlarge\ndb.r8g.24xlarge\ndb.r8g.48xlarge\ndb.r8g.large\ndb.r8g.xlarge\ndb.r8gd.2xlarge\ndb.r8gd.4xlarge\ndb.r8gd.8xlarge\ndb.r8gd.12xlarge\ndb.r8gd.16xlarge\ndb.r8gd.24xlarge\ndb.r8gd.48xlarge\ndb.r8gd.large\ndb.r8gd.xlarge\ndb.t2.2xlarge\ndb.t2.large\ndb.t2.medium\ndb.t2.micro\ndb.t2.small\ndb.t2.xlarge\ndb.t3.2xlarge\ndb.t3.large\ndb.t3.medium\ndb.t3.micro\ndb.t3.small\ndb.t3.xlarge\ndb.t4g.2xlarge\ndb.t4g.large\ndb.t4g.medium\ndb.t4g.micro\ndb.t4g.small\ndb.t4g.xlarge\ndb.x2g.2xlarge\ndb.x2g.4xlarge\ndb.x2g.8xlarge\ndb.x2g.12xlarge\ndb.x2g.16xlarge\ndb.x2g.large\ndb.x2g.xlarge",
        "value": "db.t4g.micro",
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
            "value": "db.m4.2xlarge",
            "label": "db.m4.2xlarge"
          },
          {
            "value": "db.m4.4xlarge",
            "label": "db.m4.4xlarge"
          },
          {
            "value": "db.m4.10xlarge",
            "label": "db.m4.10xlarge"
          },
          {
            "value": "db.m4.16xlarge",
            "label": "db.m4.16xlarge"
          },
          {
            "value": "db.m4.large",
            "label": "db.m4.large"
          },
          {
            "value": "db.m4.xlarge",
            "label": "db.m4.xlarge"
          },
          {
            "value": "db.m5.2xlarge",
            "label": "db.m5.2xlarge"
          },
          {
            "value": "db.m5.4xlarge",
            "label": "db.m5.4xlarge"
          },
          {
            "value": "db.m5.8xlarge",
            "label": "db.m5.8xlarge"
          },
          {
            "value": "db.m5.12xlarge",
            "label": "db.m5.12xlarge"
          },
          {
            "value": "db.m5.16xlarge",
            "label": "db.m5.16xlarge"
          },
          {
            "value": "db.m5.24xlarge",
            "label": "db.m5.24xlarge"
          },
          {
            "value": "db.m5.large",
            "label": "db.m5.large"
          },
          {
            "value": "db.m5.xlarge",
            "label": "db.m5.xlarge"
          },
          {
            "value": "db.m5d.2xlarge",
            "label": "db.m5d.2xlarge"
          },
          {
            "value": "db.m5d.4xlarge",
            "label": "db.m5d.4xlarge"
          },
          {
            "value": "db.m5d.8xlarge",
            "label": "db.m5d.8xlarge"
          },
          {
            "value": "db.m5d.12xlarge",
            "label": "db.m5d.12xlarge"
          },
          {
            "value": "db.m5d.16xlarge",
            "label": "db.m5d.16xlarge"
          },
          {
            "value": "db.m5d.24xlarge",
            "label": "db.m5d.24xlarge"
          },
          {
            "value": "db.m5d.large",
            "label": "db.m5d.large"
          },
          {
            "value": "db.m5d.xlarge",
            "label": "db.m5d.xlarge"
          },
          {
            "value": "db.m6g.2xlarge",
            "label": "db.m6g.2xlarge"
          },
          {
            "value": "db.m6g.4xlarge",
            "label": "db.m6g.4xlarge"
          },
          {
            "value": "db.m6g.8xlarge",
            "label": "db.m6g.8xlarge"
          },
          {
            "value": "db.m6g.12xlarge",
            "label": "db.m6g.12xlarge"
          },
          {
            "value": "db.m6g.16xlarge",
            "label": "db.m6g.16xlarge"
          },
          {
            "value": "db.m6g.large",
            "label": "db.m6g.large"
          },
          {
            "value": "db.m6g.xlarge",
            "label": "db.m6g.xlarge"
          },
          {
            "value": "db.m6gd.2xlarge",
            "label": "db.m6gd.2xlarge"
          },
          {
            "value": "db.m6gd.4xlarge",
            "label": "db.m6gd.4xlarge"
          },
          {
            "value": "db.m6gd.8xlarge",
            "label": "db.m6gd.8xlarge"
          },
          {
            "value": "db.m6gd.12xlarge",
            "label": "db.m6gd.12xlarge"
          },
          {
            "value": "db.m6gd.16xlarge",
            "label": "db.m6gd.16xlarge"
          },
          {
            "value": "db.m6gd.large",
            "label": "db.m6gd.large"
          },
          {
            "value": "db.m6gd.xlarge",
            "label": "db.m6gd.xlarge"
          },
          {
            "value": "db.m6i.2xlarge",
            "label": "db.m6i.2xlarge"
          },
          {
            "value": "db.m6i.4xlarge",
            "label": "db.m6i.4xlarge"
          },
          {
            "value": "db.m6i.8xlarge",
            "label": "db.m6i.8xlarge"
          },
          {
            "value": "db.m6i.12xlarge",
            "label": "db.m6i.12xlarge"
          },
          {
            "value": "db.m6i.16xlarge",
            "label": "db.m6i.16xlarge"
          },
          {
            "value": "db.m6i.24xlarge",
            "label": "db.m6i.24xlarge"
          },
          {
            "value": "db.m6i.32xlarge",
            "label": "db.m6i.32xlarge"
          },
          {
            "value": "db.m6i.large",
            "label": "db.m6i.large"
          },
          {
            "value": "db.m6i.xlarge",
            "label": "db.m6i.xlarge"
          },
          {
            "value": "db.m6id.2xlarge",
            "label": "db.m6id.2xlarge"
          },
          {
            "value": "db.m6id.4xlarge",
            "label": "db.m6id.4xlarge"
          },
          {
            "value": "db.m6id.8xlarge",
            "label": "db.m6id.8xlarge"
          },
          {
            "value": "db.m6id.12xlarge",
            "label": "db.m6id.12xlarge"
          },
          {
            "value": "db.m6id.16xlarge",
            "label": "db.m6id.16xlarge"
          },
          {
            "value": "db.m6id.24xlarge",
            "label": "db.m6id.24xlarge"
          },
          {
            "value": "db.m6id.32xlarge",
            "label": "db.m6id.32xlarge"
          },
          {
            "value": "db.m6id.large",
            "label": "db.m6id.large"
          },
          {
            "value": "db.m6id.xlarge",
            "label": "db.m6id.xlarge"
          },
          {
            "value": "db.m6idn.2xlarge",
            "label": "db.m6idn.2xlarge"
          },
          {
            "value": "db.m6idn.4xlarge",
            "label": "db.m6idn.4xlarge"
          },
          {
            "value": "db.m6idn.8xlarge",
            "label": "db.m6idn.8xlarge"
          },
          {
            "value": "db.m6idn.12xlarge",
            "label": "db.m6idn.12xlarge"
          },
          {
            "value": "db.m6idn.16xlarge",
            "label": "db.m6idn.16xlarge"
          },
          {
            "value": "db.m6idn.24xlarge",
            "label": "db.m6idn.24xlarge"
          },
          {
            "value": "db.m6idn.32xlarge",
            "label": "db.m6idn.32xlarge"
          },
          {
            "value": "db.m6idn.large",
            "label": "db.m6idn.large"
          },
          {
            "value": "db.m6idn.xlarge",
            "label": "db.m6idn.xlarge"
          },
          {
            "value": "db.m6in.2xlarge",
            "label": "db.m6in.2xlarge"
          },
          {
            "value": "db.m6in.4xlarge",
            "label": "db.m6in.4xlarge"
          },
          {
            "value": "db.m6in.8xlarge",
            "label": "db.m6in.8xlarge"
          },
          {
            "value": "db.m6in.12xlarge",
            "label": "db.m6in.12xlarge"
          },
          {
            "value": "db.m6in.16xlarge",
            "label": "db.m6in.16xlarge"
          },
          {
            "value": "db.m6in.24xlarge",
            "label": "db.m6in.24xlarge"
          },
          {
            "value": "db.m6in.32xlarge",
            "label": "db.m6in.32xlarge"
          },
          {
            "value": "db.m6in.large",
            "label": "db.m6in.large"
          },
          {
            "value": "db.m6in.xlarge",
            "label": "db.m6in.xlarge"
          },
          {
            "value": "db.m7g.2xlarge",
            "label": "db.m7g.2xlarge"
          },
          {
            "value": "db.m7g.4xlarge",
            "label": "db.m7g.4xlarge"
          },
          {
            "value": "db.m7g.8xlarge",
            "label": "db.m7g.8xlarge"
          },
          {
            "value": "db.m7g.12xlarge",
            "label": "db.m7g.12xlarge"
          },
          {
            "value": "db.m7g.16xlarge",
            "label": "db.m7g.16xlarge"
          },
          {
            "value": "db.m7g.large",
            "label": "db.m7g.large"
          },
          {
            "value": "db.m7g.xlarge",
            "label": "db.m7g.xlarge"
          },
          {
            "value": "db.m7i.2xlarge",
            "label": "db.m7i.2xlarge"
          },
          {
            "value": "db.m7i.4xlarge",
            "label": "db.m7i.4xlarge"
          },
          {
            "value": "db.m7i.8xlarge",
            "label": "db.m7i.8xlarge"
          },
          {
            "value": "db.m7i.12xlarge",
            "label": "db.m7i.12xlarge"
          },
          {
            "value": "db.m7i.16xlarge",
            "label": "db.m7i.16xlarge"
          },
          {
            "value": "db.m7i.24xlarge",
            "label": "db.m7i.24xlarge"
          },
          {
            "value": "db.m7i.48xlarge",
            "label": "db.m7i.48xlarge"
          },
          {
            "value": "db.m7i.large",
            "label": "db.m7i.large"
          },
          {
            "value": "db.m7i.xlarge",
            "label": "db.m7i.xlarge"
          },
          {
            "value": "db.m8a.2xlarge",
            "label": "db.m8a.2xlarge"
          },
          {
            "value": "db.m8a.4xlarge",
            "label": "db.m8a.4xlarge"
          },
          {
            "value": "db.m8a.8xlarge",
            "label": "db.m8a.8xlarge"
          },
          {
            "value": "db.m8a.12xlarge",
            "label": "db.m8a.12xlarge"
          },
          {
            "value": "db.m8a.16xlarge",
            "label": "db.m8a.16xlarge"
          },
          {
            "value": "db.m8a.24xlarge",
            "label": "db.m8a.24xlarge"
          },
          {
            "value": "db.m8a.48xlarge",
            "label": "db.m8a.48xlarge"
          },
          {
            "value": "db.m8a.large",
            "label": "db.m8a.large"
          },
          {
            "value": "db.m8a.xlarge",
            "label": "db.m8a.xlarge"
          },
          {
            "value": "db.m8g.2xlarge",
            "label": "db.m8g.2xlarge"
          },
          {
            "value": "db.m8g.4xlarge",
            "label": "db.m8g.4xlarge"
          },
          {
            "value": "db.m8g.8xlarge",
            "label": "db.m8g.8xlarge"
          },
          {
            "value": "db.m8g.12xlarge",
            "label": "db.m8g.12xlarge"
          },
          {
            "value": "db.m8g.16xlarge",
            "label": "db.m8g.16xlarge"
          },
          {
            "value": "db.m8g.24xlarge",
            "label": "db.m8g.24xlarge"
          },
          {
            "value": "db.m8g.48xlarge",
            "label": "db.m8g.48xlarge"
          },
          {
            "value": "db.m8g.large",
            "label": "db.m8g.large"
          },
          {
            "value": "db.m8g.xlarge",
            "label": "db.m8g.xlarge"
          },
          {
            "value": "db.m8gd.2xlarge",
            "label": "db.m8gd.2xlarge"
          },
          {
            "value": "db.m8gd.4xlarge",
            "label": "db.m8gd.4xlarge"
          },
          {
            "value": "db.m8gd.8xlarge",
            "label": "db.m8gd.8xlarge"
          },
          {
            "value": "db.m8gd.12xlarge",
            "label": "db.m8gd.12xlarge"
          },
          {
            "value": "db.m8gd.16xlarge",
            "label": "db.m8gd.16xlarge"
          },
          {
            "value": "db.m8gd.24xlarge",
            "label": "db.m8gd.24xlarge"
          },
          {
            "value": "db.m8gd.48xlarge",
            "label": "db.m8gd.48xlarge"
          },
          {
            "value": "db.m8gd.large",
            "label": "db.m8gd.large"
          },
          {
            "value": "db.m8gd.xlarge",
            "label": "db.m8gd.xlarge"
          },
          {
            "value": "db.m9g.2xlarge",
            "label": "db.m9g.2xlarge"
          },
          {
            "value": "db.m9g.4xlarge",
            "label": "db.m9g.4xlarge"
          },
          {
            "value": "db.m9g.8xlarge",
            "label": "db.m9g.8xlarge"
          },
          {
            "value": "db.m9g.12xlarge",
            "label": "db.m9g.12xlarge"
          },
          {
            "value": "db.m9g.16xlarge",
            "label": "db.m9g.16xlarge"
          },
          {
            "value": "db.m9g.24xlarge",
            "label": "db.m9g.24xlarge"
          },
          {
            "value": "db.m9g.48xlarge",
            "label": "db.m9g.48xlarge"
          },
          {
            "value": "db.m9g.large",
            "label": "db.m9g.large"
          },
          {
            "value": "db.m9g.xlarge",
            "label": "db.m9g.xlarge"
          },
          {
            "value": "db.r3.2xlarge",
            "label": "db.r3.2xlarge"
          },
          {
            "value": "db.r3.4xlarge",
            "label": "db.r3.4xlarge"
          },
          {
            "value": "db.r3.8xlarge",
            "label": "db.r3.8xlarge"
          },
          {
            "value": "db.r3.large",
            "label": "db.r3.large"
          },
          {
            "value": "db.r3.xlarge",
            "label": "db.r3.xlarge"
          },
          {
            "value": "db.r4.2xlarge",
            "label": "db.r4.2xlarge"
          },
          {
            "value": "db.r4.4xlarge",
            "label": "db.r4.4xlarge"
          },
          {
            "value": "db.r4.8xlarge",
            "label": "db.r4.8xlarge"
          },
          {
            "value": "db.r4.16xlarge",
            "label": "db.r4.16xlarge"
          },
          {
            "value": "db.r4.large",
            "label": "db.r4.large"
          },
          {
            "value": "db.r4.xlarge",
            "label": "db.r4.xlarge"
          },
          {
            "value": "db.r5.2xlarge",
            "label": "db.r5.2xlarge"
          },
          {
            "value": "db.r5.4xlarge",
            "label": "db.r5.4xlarge"
          },
          {
            "value": "db.r5.8xlarge",
            "label": "db.r5.8xlarge"
          },
          {
            "value": "db.r5.12xlarge",
            "label": "db.r5.12xlarge"
          },
          {
            "value": "db.r5.16xlarge",
            "label": "db.r5.16xlarge"
          },
          {
            "value": "db.r5.24xlarge",
            "label": "db.r5.24xlarge"
          },
          {
            "value": "db.r5.large",
            "label": "db.r5.large"
          },
          {
            "value": "db.r5.xlarge",
            "label": "db.r5.xlarge"
          },
          {
            "value": "db.r5b.2xlarge",
            "label": "db.r5b.2xlarge"
          },
          {
            "value": "db.r5b.4xlarge",
            "label": "db.r5b.4xlarge"
          },
          {
            "value": "db.r5b.8xlarge",
            "label": "db.r5b.8xlarge"
          },
          {
            "value": "db.r5b.12xlarge",
            "label": "db.r5b.12xlarge"
          },
          {
            "value": "db.r5b.16xlarge",
            "label": "db.r5b.16xlarge"
          },
          {
            "value": "db.r5b.24xlarge",
            "label": "db.r5b.24xlarge"
          },
          {
            "value": "db.r5b.large",
            "label": "db.r5b.large"
          },
          {
            "value": "db.r5b.xlarge",
            "label": "db.r5b.xlarge"
          },
          {
            "value": "db.r5d.2xlarge",
            "label": "db.r5d.2xlarge"
          },
          {
            "value": "db.r5d.4xlarge",
            "label": "db.r5d.4xlarge"
          },
          {
            "value": "db.r5d.8xlarge",
            "label": "db.r5d.8xlarge"
          },
          {
            "value": "db.r5d.12xlarge",
            "label": "db.r5d.12xlarge"
          },
          {
            "value": "db.r5d.16xlarge",
            "label": "db.r5d.16xlarge"
          },
          {
            "value": "db.r5d.24xlarge",
            "label": "db.r5d.24xlarge"
          },
          {
            "value": "db.r5d.large",
            "label": "db.r5d.large"
          },
          {
            "value": "db.r5d.xlarge",
            "label": "db.r5d.xlarge"
          },
          {
            "value": "db.r6g.2xlarge",
            "label": "db.r6g.2xlarge"
          },
          {
            "value": "db.r6g.4xlarge",
            "label": "db.r6g.4xlarge"
          },
          {
            "value": "db.r6g.8xlarge",
            "label": "db.r6g.8xlarge"
          },
          {
            "value": "db.r6g.12xlarge",
            "label": "db.r6g.12xlarge"
          },
          {
            "value": "db.r6g.16xlarge",
            "label": "db.r6g.16xlarge"
          },
          {
            "value": "db.r6g.large",
            "label": "db.r6g.large"
          },
          {
            "value": "db.r6g.xlarge",
            "label": "db.r6g.xlarge"
          },
          {
            "value": "db.r6gd.2xlarge",
            "label": "db.r6gd.2xlarge"
          },
          {
            "value": "db.r6gd.4xlarge",
            "label": "db.r6gd.4xlarge"
          },
          {
            "value": "db.r6gd.8xlarge",
            "label": "db.r6gd.8xlarge"
          },
          {
            "value": "db.r6gd.12xlarge",
            "label": "db.r6gd.12xlarge"
          },
          {
            "value": "db.r6gd.16xlarge",
            "label": "db.r6gd.16xlarge"
          },
          {
            "value": "db.r6gd.large",
            "label": "db.r6gd.large"
          },
          {
            "value": "db.r6gd.xlarge",
            "label": "db.r6gd.xlarge"
          },
          {
            "value": "db.r6i.2xlarge",
            "label": "db.r6i.2xlarge"
          },
          {
            "value": "db.r6i.4xlarge",
            "label": "db.r6i.4xlarge"
          },
          {
            "value": "db.r6i.8xlarge",
            "label": "db.r6i.8xlarge"
          },
          {
            "value": "db.r6i.12xlarge",
            "label": "db.r6i.12xlarge"
          },
          {
            "value": "db.r6i.16xlarge",
            "label": "db.r6i.16xlarge"
          },
          {
            "value": "db.r6i.24xlarge",
            "label": "db.r6i.24xlarge"
          },
          {
            "value": "db.r6i.32xlarge",
            "label": "db.r6i.32xlarge"
          },
          {
            "value": "db.r6i.large",
            "label": "db.r6i.large"
          },
          {
            "value": "db.r6i.xlarge",
            "label": "db.r6i.xlarge"
          },
          {
            "value": "db.r6id.2xlarge",
            "label": "db.r6id.2xlarge"
          },
          {
            "value": "db.r6id.4xlarge",
            "label": "db.r6id.4xlarge"
          },
          {
            "value": "db.r6id.8xlarge",
            "label": "db.r6id.8xlarge"
          },
          {
            "value": "db.r6id.12xlarge",
            "label": "db.r6id.12xlarge"
          },
          {
            "value": "db.r6id.16xlarge",
            "label": "db.r6id.16xlarge"
          },
          {
            "value": "db.r6id.24xlarge",
            "label": "db.r6id.24xlarge"
          },
          {
            "value": "db.r6id.32xlarge",
            "label": "db.r6id.32xlarge"
          },
          {
            "value": "db.r6id.large",
            "label": "db.r6id.large"
          },
          {
            "value": "db.r6id.xlarge",
            "label": "db.r6id.xlarge"
          },
          {
            "value": "db.r6idn.2xlarge",
            "label": "db.r6idn.2xlarge"
          },
          {
            "value": "db.r6idn.4xlarge",
            "label": "db.r6idn.4xlarge"
          },
          {
            "value": "db.r6idn.8xlarge",
            "label": "db.r6idn.8xlarge"
          },
          {
            "value": "db.r6idn.12xlarge",
            "label": "db.r6idn.12xlarge"
          },
          {
            "value": "db.r6idn.16xlarge",
            "label": "db.r6idn.16xlarge"
          },
          {
            "value": "db.r6idn.24xlarge",
            "label": "db.r6idn.24xlarge"
          },
          {
            "value": "db.r6idn.32xlarge",
            "label": "db.r6idn.32xlarge"
          },
          {
            "value": "db.r6idn.large",
            "label": "db.r6idn.large"
          },
          {
            "value": "db.r6idn.xlarge",
            "label": "db.r6idn.xlarge"
          },
          {
            "value": "db.r6in.2xlarge",
            "label": "db.r6in.2xlarge"
          },
          {
            "value": "db.r6in.4xlarge",
            "label": "db.r6in.4xlarge"
          },
          {
            "value": "db.r6in.8xlarge",
            "label": "db.r6in.8xlarge"
          },
          {
            "value": "db.r6in.12xlarge",
            "label": "db.r6in.12xlarge"
          },
          {
            "value": "db.r6in.16xlarge",
            "label": "db.r6in.16xlarge"
          },
          {
            "value": "db.r6in.24xlarge",
            "label": "db.r6in.24xlarge"
          },
          {
            "value": "db.r6in.32xlarge",
            "label": "db.r6in.32xlarge"
          },
          {
            "value": "db.r6in.large",
            "label": "db.r6in.large"
          },
          {
            "value": "db.r6in.xlarge",
            "label": "db.r6in.xlarge"
          },
          {
            "value": "db.r7g.2xlarge",
            "label": "db.r7g.2xlarge"
          },
          {
            "value": "db.r7g.4xlarge",
            "label": "db.r7g.4xlarge"
          },
          {
            "value": "db.r7g.8xlarge",
            "label": "db.r7g.8xlarge"
          },
          {
            "value": "db.r7g.12xlarge",
            "label": "db.r7g.12xlarge"
          },
          {
            "value": "db.r7g.16xlarge",
            "label": "db.r7g.16xlarge"
          },
          {
            "value": "db.r7g.large",
            "label": "db.r7g.large"
          },
          {
            "value": "db.r7g.xlarge",
            "label": "db.r7g.xlarge"
          },
          {
            "value": "db.r7i.2xlarge",
            "label": "db.r7i.2xlarge"
          },
          {
            "value": "db.r7i.4xlarge",
            "label": "db.r7i.4xlarge"
          },
          {
            "value": "db.r7i.8xlarge",
            "label": "db.r7i.8xlarge"
          },
          {
            "value": "db.r7i.12xlarge",
            "label": "db.r7i.12xlarge"
          },
          {
            "value": "db.r7i.16xlarge",
            "label": "db.r7i.16xlarge"
          },
          {
            "value": "db.r7i.24xlarge",
            "label": "db.r7i.24xlarge"
          },
          {
            "value": "db.r7i.48xlarge",
            "label": "db.r7i.48xlarge"
          },
          {
            "value": "db.r7i.large",
            "label": "db.r7i.large"
          },
          {
            "value": "db.r7i.xlarge",
            "label": "db.r7i.xlarge"
          },
          {
            "value": "db.r8a.2xlarge",
            "label": "db.r8a.2xlarge"
          },
          {
            "value": "db.r8a.4xlarge",
            "label": "db.r8a.4xlarge"
          },
          {
            "value": "db.r8a.8xlarge",
            "label": "db.r8a.8xlarge"
          },
          {
            "value": "db.r8a.12xlarge",
            "label": "db.r8a.12xlarge"
          },
          {
            "value": "db.r8a.16xlarge",
            "label": "db.r8a.16xlarge"
          },
          {
            "value": "db.r8a.24xlarge",
            "label": "db.r8a.24xlarge"
          },
          {
            "value": "db.r8a.48xlarge",
            "label": "db.r8a.48xlarge"
          },
          {
            "value": "db.r8a.large",
            "label": "db.r8a.large"
          },
          {
            "value": "db.r8a.xlarge",
            "label": "db.r8a.xlarge"
          },
          {
            "value": "db.r8g.2xlarge",
            "label": "db.r8g.2xlarge"
          },
          {
            "value": "db.r8g.4xlarge",
            "label": "db.r8g.4xlarge"
          },
          {
            "value": "db.r8g.8xlarge",
            "label": "db.r8g.8xlarge"
          },
          {
            "value": "db.r8g.12xlarge",
            "label": "db.r8g.12xlarge"
          },
          {
            "value": "db.r8g.16xlarge",
            "label": "db.r8g.16xlarge"
          },
          {
            "value": "db.r8g.24xlarge",
            "label": "db.r8g.24xlarge"
          },
          {
            "value": "db.r8g.48xlarge",
            "label": "db.r8g.48xlarge"
          },
          {
            "value": "db.r8g.large",
            "label": "db.r8g.large"
          },
          {
            "value": "db.r8g.xlarge",
            "label": "db.r8g.xlarge"
          },
          {
            "value": "db.r8gd.2xlarge",
            "label": "db.r8gd.2xlarge"
          },
          {
            "value": "db.r8gd.4xlarge",
            "label": "db.r8gd.4xlarge"
          },
          {
            "value": "db.r8gd.8xlarge",
            "label": "db.r8gd.8xlarge"
          },
          {
            "value": "db.r8gd.12xlarge",
            "label": "db.r8gd.12xlarge"
          },
          {
            "value": "db.r8gd.16xlarge",
            "label": "db.r8gd.16xlarge"
          },
          {
            "value": "db.r8gd.24xlarge",
            "label": "db.r8gd.24xlarge"
          },
          {
            "value": "db.r8gd.48xlarge",
            "label": "db.r8gd.48xlarge"
          },
          {
            "value": "db.r8gd.large",
            "label": "db.r8gd.large"
          },
          {
            "value": "db.r8gd.xlarge",
            "label": "db.r8gd.xlarge"
          },
          {
            "value": "db.t2.2xlarge",
            "label": "db.t2.2xlarge"
          },
          {
            "value": "db.t2.large",
            "label": "db.t2.large"
          },
          {
            "value": "db.t2.medium",
            "label": "db.t2.medium"
          },
          {
            "value": "db.t2.micro",
            "label": "db.t2.micro"
          },
          {
            "value": "db.t2.small",
            "label": "db.t2.small"
          },
          {
            "value": "db.t2.xlarge",
            "label": "db.t2.xlarge"
          },
          {
            "value": "db.t3.2xlarge",
            "label": "db.t3.2xlarge"
          },
          {
            "value": "db.t3.large",
            "label": "db.t3.large"
          },
          {
            "value": "db.t3.medium",
            "label": "db.t3.medium"
          },
          {
            "value": "db.t3.micro",
            "label": "db.t3.micro"
          },
          {
            "value": "db.t3.small",
            "label": "db.t3.small"
          },
          {
            "value": "db.t3.xlarge",
            "label": "db.t3.xlarge"
          },
          {
            "value": "db.t4g.2xlarge",
            "label": "db.t4g.2xlarge"
          },
          {
            "value": "db.t4g.large",
            "label": "db.t4g.large"
          },
          {
            "value": "db.t4g.medium",
            "label": "db.t4g.medium"
          },
          {
            "value": "db.t4g.micro",
            "label": "db.t4g.micro"
          },
          {
            "value": "db.t4g.small",
            "label": "db.t4g.small"
          },
          {
            "value": "db.t4g.xlarge",
            "label": "db.t4g.xlarge"
          },
          {
            "value": "db.x2g.2xlarge",
            "label": "db.x2g.2xlarge"
          },
          {
            "value": "db.x2g.4xlarge",
            "label": "db.x2g.4xlarge"
          },
          {
            "value": "db.x2g.8xlarge",
            "label": "db.x2g.8xlarge"
          },
          {
            "value": "db.x2g.12xlarge",
            "label": "db.x2g.12xlarge"
          },
          {
            "value": "db.x2g.16xlarge",
            "label": "db.x2g.16xlarge"
          },
          {
            "value": "db.x2g.large",
            "label": "db.x2g.large"
          },
          {
            "value": "db.x2g.xlarge",
            "label": "db.x2g.xlarge"
          }
        ],
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 4,
        "tag": "INPUT",
        "type": "text",
        "label": "DBインスタンスタイプを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 5,
        "tag": "INPUT",
        "type": "text",
        "label": "インスタンスタイプファミリーを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 6,
        "tag": "INPUT",
        "type": "text",
        "label": "インスタンスカテゴリを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 7,
        "tag": "INPUT",
        "type": "text",
        "label": "vCPUを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 8,
        "tag": "INPUT",
        "type": "text",
        "label": "メモリ (GiB)を絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 9,
        "tag": "INPUT",
        "type": "text",
        "label": "ネットワークパフォーマンスを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 10,
        "tag": "INPUT",
        "type": "text",
        "label": "EBSスループットを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 11,
        "tag": "INPUT",
        "type": "text",
        "label": "CurrentGenerationを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 12,
        "tag": "INPUT",
        "type": "text",
        "label": "オンデマンドの 1 時間あたりのコストを絞り込み",
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
        "context": "",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-instance-hours",
        "index": 13,
        "tag": "INPUT",
        "type": "number",
        "label": "使用状況 (オンデマンドのみ) (時間/月)",
        "value": "730",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": "730",
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "使用状況 (オンデマンドのみ) (時間/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-instance-quantity",
        "index": 14,
        "tag": "INPUT",
        "type": "number",
        "label": "ノード",
        "value": "1",
        "visible": true,
        "disabled": false,
        "min": "1",
        "max": null,
        "step": "1",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "ノード",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 15,
        "tag": "INPUT",
        "type": "checkbox",
        "label": "この項目を有効にする",
        "value": true,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": "storage",
        "options": null,
        "context": "この項目を有効にする",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-storage-usageMode",
        "index": 16,
        "tag": "SELECT",
        "type": "select-one",
        "label": "使用量の入力方法\n容量・利用時間から計算\n月間合計使用量を直接入力 (詳細)",
        "value": "capacity",
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
            "value": "capacity",
            "label": "容量・利用時間から計算"
          },
          {
            "value": "aggregate",
            "label": "月間合計使用量を直接入力 (詳細)"
          }
        ],
        "context": "使用量の入力方法\n容量・利用時間から計算\n月間合計使用量を直接入力 (詳細)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-storage-capacityGb",
        "index": 17,
        "tag": "INPUT",
        "type": "number",
        "label": "DB 1 台あたりのストレージ量 (GiB)",
        "value": "20",
        "visible": true,
        "disabled": false,
        "min": "20",
        "max": "65536",
        "step": "1",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "DB 1 台あたりのストレージ量 (GiB)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-storage-storageHours",
        "index": 18,
        "tag": "INPUT",
        "type": "number",
        "label": "ストレージ利用時間 (時間/月)",
        "value": "730",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": "730",
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "ストレージ利用時間 (時間/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-storage-gbMonths",
        "index": 19,
        "tag": "INPUT",
        "type": "number",
        "label": "合計ストレージ量 (GB/月)",
        "value": "20",
        "visible": true,
        "disabled": true,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "合計ストレージ量 (GB/月)",
        "section": "料金見積もりの制約"
      }
    ],
    "official": [
      {
        "domId": "formField92-1791893608058-7709",
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
        "domId": "formField94-1791893608062-830",
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
        "domId": "formField107-1791893608066-5481",
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
        "domId": "formField326-1791893609035-2389",
        "index": 3,
        "tag": "INPUT",
        "type": "text",
        "label": "Nodes",
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
        "domId": "input328-1791893609038-5594",
        "index": 4,
        "tag": "INPUT",
        "type": "text",
        "label": "",
        "value": "db.m4.10xlarge",
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
        "domId": "formField338-1791893609040-2250",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "Utilization (On-Demand only) Value",
        "value": "100",
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
        "domId": "formField340-1791893609041-6086",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "%Utilized/Month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "%Utilized/Month"
      },
      {
        "domId": "formField350-1791893609042-4778",
        "index": 7,
        "tag": "BUTTON",
        "type": "button",
        "label": "Deployment Option",
        "value": "Multi-AZ",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Multi-AZ"
      },
      {
        "domId": "formField360-1791893609043-8293",
        "index": 8,
        "tag": "BUTTON",
        "type": "button",
        "label": "Pricing Model",
        "value": "OnDemand",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "OnDemand"
      },
      {
        "domId": "formField198-1791893608139-2618",
        "index": 9,
        "tag": "BUTTON",
        "type": "button",
        "label": "Would you be creating an RDS Proxy with the database?",
        "value": "Yes",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Yes"
      },
      {
        "domId": "formField263-1791893608419-9220",
        "index": 10,
        "tag": "BUTTON",
        "type": "button",
        "label": "Storage volume",
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
        "domId": "formField141-1791893608083-8067",
        "index": 11,
        "tag": "INPUT",
        "type": "number",
        "label": "Storage amount Value",
        "value": "100",
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
        "domId": "formField143-1791893608083-1592",
        "index": 12,
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
        "domId": "formField273-1791893608420-2020",
        "index": 13,
        "tag": "BUTTON",
        "type": "button",
        "label": "Would you be enabling Database Insights with the database?",
        "value": "Yes",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Yes"
      },
      {
        "domId": "formField284-1791893608423-40",
        "index": 14,
        "tag": "BUTTON",
        "type": "button",
        "label": "Do you plan on running an Extended Support major version (PostgreSQL 11 or higher)?",
        "value": "Yes",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Yes"
      },
      {
        "domId": "formField294-1791893608424-2703",
        "index": 15,
        "tag": "BUTTON",
        "type": "button",
        "label": "Please choose the pricing year for RDS Extended Support (Pricing in year 3 is higher than the pricing in the first 2 years)",
        "value": "Year 1 and Year 2 cost",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Year 1 and Year 2 cost"
      },
      {
        "domId": "formField251-1791893608392-3852",
        "index": 16,
        "tag": "INPUT",
        "type": "number",
        "label": "Number of hours running on Amazon RDS Extended Support Value",
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
        "domId": "formField253-1791893608392-6396",
        "index": 17,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "per month",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "per month"
      }
    ]
  },
  "severity": "HIGH"
}
```
