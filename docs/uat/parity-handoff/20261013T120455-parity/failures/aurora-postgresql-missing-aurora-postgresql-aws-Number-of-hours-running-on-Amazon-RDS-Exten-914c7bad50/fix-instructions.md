# aurora-postgresql-missing-aurora-postgresql-aws-Number-of-hours-running-on-Amazon-RDS-Exten-914c7bad50 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: aurora-postgresql。Profile: {"local": "provisioned-standard", "official": {"variant": "default", "requestedRegion": null, "region": "us-east-2", "regionDisplay": "US East (Ohio)"}}。Region: {"local": "us-east-2", "official": "us-east-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/AuroraPostgreSQL。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/aurora-postgresql/aurora-postgresql-missing-aurora-postgresql-aws-Number-of-hours-running-on-Amazon-RDS-Exten-914c7bad50.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "aurora-postgresql-missing-aurora-postgresql-aws-Number-of-hours-running-on-Amazon-RDS-Exten-914c7bad50",
  "serviceId": "aurora-postgresql",
  "profile": {
    "local": "provisioned-standard",
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
    "Number of hours running on Amazon RDS Extended Support Value"
  ],
  "officialFieldIds": [
    "aurora-postgresql:aws:Number-of-hours-running-on-Amazon-RDS-Extended-Support-Value-numb-c2a6031323"
  ],
  "localFieldIds": [],
  "correspondenceRowId": "aurora-postgresql:aws:Number-of-hours-running-on-Amazon-RDS-Extended-Support-Value-numb-c2a6031323",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/AuroraPostgreSQL"
  },
  "allInputs": {
    "localObservation": "observations/local-aurora-postgresql-185.json",
    "officialObservation": "observations/aws-aurora-postgresql-3.json",
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
      "file": "observations/local-aurora-postgresql-185.json",
      "screen": "screenshots/local-aurora-postgresql-185.png",
      "condition": {
        "profile": {
          "value": "provisioned-standard",
          "label": "プロビジョニング済み / Aurora Standard"
        },
        "region": "us-east-2",
        "variant": "region",
        "requestedProfile": {
          "value": "provisioned-standard",
          "label": "プロビジョニング済み / Aurora Standard"
        },
        "profileObservedFrom": "drawer-profile DOM value"
      }
    },
    "aws": {
      "file": "observations/aws-aurora-postgresql-3.json",
      "screen": "screenshots/aws-aurora-postgresql-3.png",
      "condition": {
        "variant": "default",
        "requestedRegion": null,
        "region": "us-east-2",
        "regionDisplay": "US East (Ohio)"
      },
      "value": "",
      "domId": "formField2998-1791893426266-3068",
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
        "label": "利用方式\nプロビジョニング済み / Aurora Standard\nプロビジョニング済み / Aurora I/O 最適化\nServerless v2 / Aurora Standard\nServerless v2 / Aurora I/O 最適化\nAurora PostgreSQL Limitless Database",
        "value": "provisioned-standard",
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
            "value": "provisioned-standard",
            "label": "プロビジョニング済み / Aurora Standard"
          },
          {
            "value": "provisioned-io-optimized",
            "label": "プロビジョニング済み / Aurora I/O 最適化"
          },
          {
            "value": "serverless-standard",
            "label": "Serverless v2 / Aurora Standard"
          },
          {
            "value": "serverless-io-optimized",
            "label": "Serverless v2 / Aurora I/O 最適化"
          },
          {
            "value": "limitless-io-optimized",
            "label": "Aurora PostgreSQL Limitless Database"
          }
        ],
        "context": "利用方式\nプロビジョニング済み / Aurora Standard\nプロビジョニング済み / Aurora I/O 最適化\nServerless v2 / Aurora Standard\nServerless v2 / Aurora I/O 最適化\nAurora PostgreSQL Limitless Database",
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
        "domId": "input-component-instance-instanceType",
        "index": 2,
        "tag": "SELECT",
        "type": "select-one",
        "label": "インスタンスタイプ\ndb.r4.2xlarge\ndb.r4.4xlarge\ndb.r4.8xlarge\ndb.r4.16xlarge\ndb.r4.large\ndb.r4.xlarge\ndb.r5.2xlarge\ndb.r5.4xlarge\ndb.r5.8xlarge\ndb.r5.12xlarge\ndb.r5.16xlarge\ndb.r5.24xlarge\ndb.r5.large\ndb.r5.xlarge\ndb.r6g.2xlarge\ndb.r6g.4xlarge\ndb.r6g.8xlarge\ndb.r6g.12xlarge\ndb.r6g.16xlarge\ndb.r6g.large\ndb.r6g.xlarge\ndb.r6gd.2xlarge\ndb.r6gd.4xlarge\ndb.r6gd.8xlarge\ndb.r6gd.12xlarge\ndb.r6gd.16xlarge\ndb.r6gd.xlarge\ndb.r6i.2xlarge\ndb.r6i.4xlarge\ndb.r6i.8xlarge\ndb.r6i.12xlarge\ndb.r6i.16xlarge\ndb.r6i.24xlarge\ndb.r6i.32xlarge\ndb.r6i.large\ndb.r6i.xlarge\ndb.r6id.24xlarge\ndb.r6id.32xlarge\ndb.r7g.2xlarge\ndb.r7g.4xlarge\ndb.r7g.8xlarge\ndb.r7g.12xlarge\ndb.r7g.16xlarge\ndb.r7g.large\ndb.r7g.xlarge\ndb.r7i.2xlarge\ndb.r7i.4xlarge\ndb.r7i.8xlarge\ndb.r7i.12xlarge\ndb.r7i.16xlarge\ndb.r7i.24xlarge\ndb.r7i.48xlarge\ndb.r7i.large\ndb.r7i.xlarge\ndb.r8a.2xlarge\ndb.r8a.4xlarge\ndb.r8a.8xlarge\ndb.r8a.12xlarge\ndb.r8a.16xlarge\ndb.r8a.24xlarge\ndb.r8a.48xlarge\ndb.r8a.large\ndb.r8a.xlarge\ndb.r8g.2xlarge\ndb.r8g.4xlarge\ndb.r8g.8xlarge\ndb.r8g.12xlarge\ndb.r8g.16xlarge\ndb.r8g.24xlarge\ndb.r8g.48xlarge\ndb.r8g.large\ndb.r8g.xlarge\ndb.r8gd.2xlarge\ndb.r8gd.4xlarge\ndb.r8gd.8xlarge\ndb.r8gd.12xlarge\ndb.r8gd.16xlarge\ndb.r8gd.24xlarge\ndb.r8gd.48xlarge\ndb.r8gd.xlarge\ndb.t3.large\ndb.t3.medium\ndb.t4g.large\ndb.t4g.medium\ndb.x2g.2xlarge\ndb.x2g.4xlarge\ndb.x2g.8xlarge\ndb.x2g.12xlarge\ndb.x2g.16xlarge\ndb.x2g.large\ndb.x2g.xlarge",
        "value": "db.t4g.medium",
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
            "value": "db.r6id.24xlarge",
            "label": "db.r6id.24xlarge"
          },
          {
            "value": "db.r6id.32xlarge",
            "label": "db.r6id.32xlarge"
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
            "value": "db.r8gd.xlarge",
            "label": "db.r8gd.xlarge"
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
            "value": "db.t4g.large",
            "label": "db.t4g.large"
          },
          {
            "value": "db.t4g.medium",
            "label": "db.t4g.medium"
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
        "context": "インスタンスタイプ\ndb.r4.2xlarge\ndb.r4.4xlarge\ndb.r4.8xlarge\ndb.r4.16xlarge\ndb.r4.large\ndb.r4.xlarge\ndb.r5.2xlarge\ndb.r5.4xlarge\ndb.r5.8xlarge\ndb.r5.12xlarge\ndb.r5.16xlarge\ndb.r5.24xlarge\ndb.r5.large\ndb.r5.xlarge\ndb.r6g.2xlarge\ndb.r6g.4xlarge\ndb.r6g.8xlarge\ndb.r6g.12xlarge\ndb.r6g.16xlarge\ndb.r6g.large\ndb.r6g.xlarge\ndb.r6gd.2xlarge\ndb.r6gd.4xlarge\ndb.r6gd.8xlarge\ndb.r6gd.12xlarge\ndb.r6gd.16xlarge\ndb.r6gd.xlarge\ndb.r6i.2xlarge\ndb.r6i.4xlarge\ndb.r6i.8xlarge\ndb.r6i.12xlarge\ndb.r6i.16xlarge\ndb.r6i.24xlarge\ndb.r6i.32xlarge\ndb.r6i.large\ndb.r6i.xlarge\ndb.r6id.24xlarge\ndb.r6id.32xlarge\ndb.r7g.2xlarge\ndb.r7g.4xlarge\ndb.r7g.8xlarge\ndb.r7g.12xlarge\ndb.r7g.16xlarge\ndb.r7g.large\ndb.r7g.xlarge\ndb.r7i.2xlarge\ndb.r7i.4xlarge\ndb.r7i.8xlarge\ndb.r7i.12xlarge\ndb.r7i.16xlarge\ndb.r7i.24xlarge\ndb.r7i.48xlarge\ndb.r7i.large\ndb.r7i.xlarge\ndb.r8a.2xlarge\ndb.r8a.4xlarge\ndb.r8a.8xlarge\ndb.r8a.12xlarge\ndb.r8a.16xlarge\ndb.r8a.24xlarge\ndb.r8a.48xlarge\ndb.r8a.large\ndb.r8a.xlarge\ndb.r8g.2xlarge\ndb.r8g.4xlarge\ndb.r8g.8xlarge\ndb.r8g.12xlarge\ndb.r8g.16xlarge\ndb.r8g.24xlarge\ndb.r8g.48xlarge\ndb.r8g.large\ndb.r8g.xlarge\ndb.r8gd.2xlarge\ndb.r8gd.4xlarge\ndb.r8gd.8xlarge\ndb.r8gd.12xlarge\ndb.r8gd.16xlarge\ndb.r8gd.24xlarge\ndb.r8gd.48xlarge\ndb.r8gd.xlarge\ndb.t3.large\ndb.t3.medium\ndb.t4g.large\ndb.t4g.medium\ndb.x2g.2xlarge\ndb.x2g.4xlarge\ndb.x2g.8xlarge\ndb.x2g.12xlarge\ndb.x2g.16xlarge\ndb.x2g.large\ndb.x2g.xlarge",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-instance-hours",
        "index": 3,
        "tag": "INPUT",
        "type": "number",
        "label": "使用率 (時間/月)",
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
        "context": "使用率 (時間/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-instance-quantity",
        "index": 4,
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
        "domId": "input-component-storage-gbMonths",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "ストレージ量 (GB/月)",
        "value": "20",
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
        "domId": "input-component-io-requests-requests",
        "index": 6,
        "tag": "INPUT",
        "type": "number",
        "label": "I/O リクエスト数 (件/月)",
        "value": "1000000",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "I/O リクエスト数 (件/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 7,
        "tag": "INPUT",
        "type": "checkbox",
        "label": "この項目を有効にする",
        "value": false,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": "backup-storage",
        "options": null,
        "context": "この項目を有効にする",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-backup-storage-gbMonths",
        "index": 8,
        "tag": "INPUT",
        "type": "number",
        "label": "追加のバックアップストレージ (GB/月)",
        "value": "0",
        "visible": true,
        "disabled": true,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "追加のバックアップストレージ (GB/月)",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "",
        "index": 9,
        "tag": "INPUT",
        "type": "checkbox",
        "label": "この項目を有効にする",
        "value": false,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": "snapshot-export",
        "options": null,
        "context": "この項目を有効にする",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-snapshot-export-processedGb",
        "index": 10,
        "tag": "INPUT",
        "type": "number",
        "label": "エクスポート用に処理されたバックアップの合計サイズ (GB)",
        "value": "0",
        "visible": true,
        "disabled": true,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "エクスポート用に処理されたバックアップの合計サイズ (GB)",
        "section": "料金見積もりの制約"
      }
    ],
    "official": [
      {
        "domId": "formField2731-1791893425644-4541",
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
        "domId": "formField2733-1791893425645-7343",
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
        "domId": "formField2746-1791893425646-5022",
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
        "domId": "2758-1791893425659-2185",
        "index": 3,
        "tag": "INPUT",
        "type": "radio",
        "label": "Aurora PostgreSQL-Compatible Edition",
        "value": true,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "awsui-tiles-2757-1791893425659-1314",
        "radioValue": "AuroraPostgreSQLCompatibleDB",
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "2759-1791893425659-9393",
        "index": 4,
        "tag": "INPUT",
        "type": "radio",
        "label": "Aurora Serverless PostgreSQL-Compatible Edition",
        "value": false,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "awsui-tiles-2757-1791893425659-1314",
        "radioValue": "auroraServerlessPostgreSQLv2",
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "2760-1791893425659-1293",
        "index": 5,
        "tag": "INPUT",
        "type": "radio",
        "label": "Amazon Aurora PostgreSQL Limitless Database",
        "value": false,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "awsui-tiles-2757-1791893425659-1314",
        "radioValue": "auroralimitlessPostgres",
        "toggle": null,
        "options": null,
        "context": ""
      },
      {
        "domId": "formField2878-1791893425703-8191",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Aurora PostgreSQL Cluster Configuration Option",
        "value": "Aurora Standard",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Aurora Standard"
      },
      {
        "domId": "formField3203-1791893426964-8020",
        "index": 7,
        "tag": "INPUT",
        "type": "text",
        "label": "Quantity",
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
        "domId": "input3205-1791893426966-2924",
        "index": 8,
        "tag": "INPUT",
        "type": "text",
        "label": "",
        "value": "db.r6g.large",
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
        "domId": "formField3215-1791893426969-9035",
        "index": 9,
        "tag": "INPUT",
        "type": "number",
        "label": "Utilization Value",
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
        "domId": "formField3217-1791893426969-1687",
        "index": 10,
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
        "domId": "formField3227-1791893426971-2456",
        "index": 11,
        "tag": "BUTTON",
        "type": "button",
        "label": "Pricing model",
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
        "domId": "formField2897-1791893425706-1915",
        "index": 12,
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
        "domId": "formField2916-1791893425709-5832",
        "index": 13,
        "tag": "INPUT",
        "type": "number",
        "label": "Storage amount Value",
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
        "domId": "formField2918-1791893425710-8019",
        "index": 14,
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
        "domId": "formField2929-1791893425711-3275",
        "index": 15,
        "tag": "INPUT",
        "type": "number",
        "label": "Baseline IO rate Value",
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
        "domId": "formField2931-1791893425711-6224",
        "index": 16,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "per second",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "per second"
      },
      {
        "domId": "formField2942-1791893425712-1189",
        "index": 17,
        "tag": "INPUT",
        "type": "number",
        "label": "Peak IO rate Value",
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
        "domId": "formField2944-1791893425712-9819",
        "index": 18,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "per second",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "per second"
      },
      {
        "domId": "formField2955-1791893425713-486",
        "index": 19,
        "tag": "INPUT",
        "type": "number",
        "label": "Duration of peak IO activity Value",
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
        "domId": "formField2957-1791893425714-6484",
        "index": 20,
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
        "domId": "formField3076-1791893426318-5318",
        "index": 21,
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
        "domId": "formField3087-1791893426320-6216",
        "index": 22,
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
        "domId": "formField3097-1791893426321-4469",
        "index": 23,
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
        "domId": "formField2998-1791893426266-3068",
        "index": 24,
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
        "domId": "formField3000-1791893426266-7870",
        "index": 25,
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
