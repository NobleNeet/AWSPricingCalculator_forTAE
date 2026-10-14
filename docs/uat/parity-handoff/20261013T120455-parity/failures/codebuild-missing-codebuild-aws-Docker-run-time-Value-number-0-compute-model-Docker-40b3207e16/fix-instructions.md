# codebuild-missing-codebuild-aws-Docker-run-time-Value-number-0-compute-model-Docker-40b3207e16 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: codebuild。Profile: {"local": "on-demand-ec2", "official": {"variant": "selector", "selector": {"id": "formField125-1791904118231-4447", "value": "On-Demand EC2", "label": "AWS CodeBuild Compute Type |  | On-Demand EC2", "base": "AWS CodeBuild Compute Type", "nth": 0}, "value": "Docker Image Server", "options": [{"label": "On-Demand EC2", "disabled": null}, {"label": "On-Demand Lambda", "disabled": null}, {"label": "Reserved Capacity EC2", "disabled": null}, {"label": "Sandbox", "disabled": null}, {"label": "Reserved EC2 Attributes", "disabled": null}, {"label": "Docker Image Server", "disabled": null}], "omitted": [], "omissionReason": null, "requestedRegion": null, "region": "us-east-2", "regionDisplay": "US East (Ohio)"}}。Region: {"local": "us-east-2", "official": "us-east-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/codebuild。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/codebuild/codebuild-missing-codebuild-aws-Docker-run-time-Value-number-0-compute-model-Docker-40b3207e16.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "codebuild-missing-codebuild-aws-Docker-run-time-Value-number-0-compute-model-Docker-40b3207e16",
  "serviceId": "codebuild",
  "profile": {
    "local": "on-demand-ec2",
    "official": {
      "variant": "selector",
      "selector": {
        "id": "formField125-1791904118231-4447",
        "value": "On-Demand EC2",
        "label": "AWS CodeBuild Compute Type |  | On-Demand EC2",
        "base": "AWS CodeBuild Compute Type",
        "nth": 0
      },
      "value": "Docker Image Server",
      "options": [
        {
          "label": "On-Demand EC2",
          "disabled": null
        },
        {
          "label": "On-Demand Lambda",
          "disabled": null
        },
        {
          "label": "Reserved Capacity EC2",
          "disabled": null
        },
        {
          "label": "Sandbox",
          "disabled": null
        },
        {
          "label": "Reserved EC2 Attributes",
          "disabled": null
        },
        {
          "label": "Docker Image Server",
          "disabled": null
        }
      ],
      "omitted": [],
      "omissionReason": null,
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
    "Docker run time Value"
  ],
  "officialFieldIds": [
    "codebuild:aws:Docker-run-time-Value-number-0-compute-model-Docker-Image-Server-c0951854f1"
  ],
  "localFieldIds": [],
  "correspondenceRowId": "codebuild:aws:Docker-run-time-Value-number-0-compute-model-Docker-Image-Server-c0951854f1",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/codebuild"
  },
  "allInputs": {
    "localObservation": "observations/local-codebuild-263.json",
    "officialObservation": "observations/aws-codebuild-197.json",
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
      "file": "observations/local-codebuild-263.json",
      "screen": "screenshots/local-codebuild-263.png",
      "condition": {
        "profile": {
          "value": "on-demand-ec2",
          "label": "オンデマンド EC2"
        },
        "region": "us-east-2",
        "variant": "region",
        "requestedProfile": {
          "value": "on-demand-ec2",
          "label": "オンデマンド EC2"
        },
        "profileObservedFrom": "drawer-profile DOM value"
      }
    },
    "aws": {
      "file": "observations/aws-codebuild-197.json",
      "screen": "screenshots/aws-codebuild-197.png",
      "condition": {
        "variant": "selector",
        "selector": {
          "id": "formField125-1791904118231-4447",
          "value": "On-Demand EC2",
          "label": "AWS CodeBuild Compute Type |  | On-Demand EC2",
          "base": "AWS CodeBuild Compute Type",
          "nth": 0
        },
        "value": "Docker Image Server",
        "options": [
          {
            "label": "On-Demand EC2",
            "disabled": null
          },
          {
            "label": "On-Demand Lambda",
            "disabled": null
          },
          {
            "label": "Reserved Capacity EC2",
            "disabled": null
          },
          {
            "label": "Sandbox",
            "disabled": null
          },
          {
            "label": "Reserved EC2 Attributes",
            "disabled": null
          },
          {
            "label": "Docker Image Server",
            "disabled": null
          }
        ],
        "omitted": [],
        "omissionReason": null,
        "requestedRegion": null,
        "region": "us-east-2",
        "regionDisplay": "US East (Ohio)"
      },
      "value": "10",
      "domId": "formField425-1791904128964-6311",
      "section": "",
      "context": "Docker run time"
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
        "label": "利用方式\nオンデマンド EC2",
        "value": "on-demand-ec2",
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
            "value": "on-demand-ec2",
            "label": "オンデマンド EC2"
          }
        ],
        "context": "利用方式\nオンデマンド EC2",
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
        "domId": "input-profile--operatingSystem",
        "index": 2,
        "tag": "SELECT",
        "type": "select-one",
        "label": "オペレーティングシステム\nLinux\nWindows",
        "value": "Linux",
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
            "value": "Linux",
            "label": "Linux"
          },
          {
            "value": "Windows",
            "label": "Windows"
          }
        ],
        "context": "オペレーティングシステム\nLinux\nWindows",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-build-minutes-computeType",
        "index": 3,
        "tag": "SELECT",
        "type": "select-one",
        "label": "インスタンスタイプを検索\narm1.2xlarge\narm1.large\narm1.medium\narm1.small\narm1.xlarge\ngeneral1.2xlarge\ngeneral1.large\ngeneral1.medium\ngeneral1.small\ngeneral1.xlarge\ngpu1.large",
        "value": "arm1.2xlarge",
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
            "value": "arm1.2xlarge",
            "label": "arm1.2xlarge"
          },
          {
            "value": "arm1.large",
            "label": "arm1.large"
          },
          {
            "value": "arm1.medium",
            "label": "arm1.medium"
          },
          {
            "value": "arm1.small",
            "label": "arm1.small"
          },
          {
            "value": "arm1.xlarge",
            "label": "arm1.xlarge"
          },
          {
            "value": "general1.2xlarge",
            "label": "general1.2xlarge"
          },
          {
            "value": "general1.large",
            "label": "general1.large"
          },
          {
            "value": "general1.medium",
            "label": "general1.medium"
          },
          {
            "value": "general1.small",
            "label": "general1.small"
          },
          {
            "value": "general1.xlarge",
            "label": "general1.xlarge"
          },
          {
            "value": "gpu1.large",
            "label": "gpu1.large"
          }
        ],
        "context": "インスタンスタイプを検索\narm1.2xlarge\narm1.large\narm1.medium\narm1.small\narm1.xlarge\ngeneral1.2xlarge\ngeneral1.large\ngeneral1.medium\ngeneral1.small\ngeneral1.xlarge\ngpu1.large",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-build-minutes-durationUnit",
        "index": 4,
        "tag": "SELECT",
        "type": "select-one",
        "label": "ユニット\nminutes",
        "value": "minutes",
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
            "value": "minutes",
            "label": "minutes"
          }
        ],
        "context": "ユニット\nminutes",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-build-minutes-buildsPerMonth",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "1 か月あたりのビルド数",
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
        "context": "1 か月あたりのビルド数",
        "section": "料金見積もりの制約"
      },
      {
        "domId": "input-component-build-minutes-averageBuildMinutes",
        "index": 6,
        "tag": "INPUT",
        "type": "number",
        "label": "平均ビルド時間 (分)",
        "value": "10",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": null,
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "平均ビルド時間 (分)",
        "section": "料金見積もりの制約"
      }
    ],
    "official": [
      {
        "domId": "formField92-1791904118190-7223",
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
        "context": "",
        "section": ""
      },
      {
        "domId": "formField94-1791904118193-9311",
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
        "context": "Region",
        "section": ""
      },
      {
        "domId": "formField107-1791904118197-3972",
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
        "context": "US East (Ohio)",
        "section": ""
      },
      {
        "domId": "formField125-1791904118231-4447",
        "index": 3,
        "tag": "BUTTON",
        "type": "button",
        "label": "AWS CodeBuild Compute Type",
        "value": "Docker Image Server",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Docker Image Server",
        "section": ""
      },
      {
        "domId": "formField423-1791904128963-3599",
        "index": 4,
        "tag": "INPUT",
        "type": "text",
        "label": "Number of instances",
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
        "context": "Number of instances",
        "section": ""
      },
      {
        "domId": "formField425-1791904128964-6311",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "Docker run time Value",
        "value": "10",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Docker run time",
        "section": ""
      },
      {
        "domId": "formField427-1791904128964-7019",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Unit",
        "value": "Minutes",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Minutes",
        "section": ""
      }
    ]
  },
  "severity": "HIGH"
}
```
