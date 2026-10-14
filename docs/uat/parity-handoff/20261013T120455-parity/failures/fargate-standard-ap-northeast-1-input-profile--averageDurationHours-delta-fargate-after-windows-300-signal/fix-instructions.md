# fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: fargate。Profile: "standard"。Region: "ap-northeast-1"。
重大度: MEDIUM。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/Fargate。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T03:58:11.104Z。公開build: 20261013T095030Z-78197541。
不具合観測: Configured inputs produced a total or delta difference above $0.01; investigate math and equivalence before attributing root cause.
入力判定: INCOMPLETE。料金判定: FAIL。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/fargate/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal",
  "serviceId": "fargate",
  "profile": "standard",
  "region": "ap-northeast-1",
  "parameter": "input-profile--averageDurationHours",
  "officialFieldId": "fargate:Average duration Value",
  "localFieldId": "fargate:input-profile--averageDurationHours",
  "correspondenceRowId": "fargate:input-profile--averageDurationHours",
  "comparisonScope": "parent-service",
  "runnerSha256": "804fa171d2306b60873d253714595b7ea2e2161778aa1e1cb304235828f5613c",
  "runnerSource": "runners/versions/804fa171d2306b60873d253714595b7ea2e2161778aa1e1cb304235828f5613c.mjs",
  "pricingCaseMethod": "Independent new GUI Project and official BrowserContext for each case. Baseline values set through real controls; native numeric input application verified with up to 3 bounded attempts.",
  "inputVerdict": "INCOMPLETE",
  "pricingVerdict": "FAIL",
  "toleranceUsd": "0.01",
  "plannedInputs": {
    "baseline": [
      {
        "local": "input-profile--tasksPerDay",
        "official": "Number of tasks or pods Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 1000
      },
      {
        "local": "input-profile--averageDurationHours",
        "official": "Average duration Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": "0.083333333333333333333"
      },
      {
        "local": "input-profile--windowsVcpuPerTask",
        "official": "SELECT:Amount of vCPU allocated",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 1
      },
      {
        "local": "input-profile--windowsMemoryGbPerTask",
        "official": "Amount of memory allocated Value",
        "officialOccurrence": 0,
        "officialAssociationLabels": null,
        "value": 4
      }
    ],
    "change": {
      "local": "input-profile--averageDurationHours",
      "official": "Average duration Value",
      "before": "0.083333333333333333333",
      "after": "0.083611111111111111111"
    },
    "baselineRole": "GUI configuration seed. Reproduce effectiveBaseline/localBefore/awsBefore, which include explicitly saved dependency preparation."
  },
  "inputConversions": {
    "field": "Average duration Value",
    "optionMap": {
      "0.083333333333333333333": 300,
      "0.083611111111111111111": 301
    },
    "dependentSyncProcedure": null,
    "setupProcedure": "async()=>{if(windows){await inputLocal('input-profile--operatingSystem','Windows');await choose('Operating system','Windows');}await choose('CURRENT:minutes','seconds');}",
    "prepareProcedure": null,
    "variant": "fargate-after-windows-300",
    "dependentSync": null
  },
  "executionState": "FINISHED",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/Fargate"
  },
  "startedAt": "2026-10-14T03:57:44.730Z",
  "localBefore": {
    "observedAt": "2026-10-14T03:58:06.075Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$328.45",
    "monthlyUsd": "328.45",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "328.45",
      "328.45"
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
        "label": "利用方式\nFargate オンデマンド",
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
            "label": "Fargate オンデマンド"
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
        "id": "input-profile--operatingSystem",
        "label": "オペレーティングシステム\nLinux\nWindows",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "Windows",
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
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--cpuArchitecture",
        "label": "CPU アーキテクチャ\nx86\nARM",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "x86",
        "options": [
          {
            "value": "x86",
            "label": "x86"
          },
          {
            "value": "ARM",
            "label": "ARM"
          }
        ],
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--tasksPerDay",
        "label": "タスクまたはポッドの数 (件/日)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--averageDurationHours",
        "label": "平均期間 (時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "0.083333333333333333333",
        "options": null,
        "value": "0.083333333333333333333",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--linuxVcpuPerTask",
        "label": "割り当てられた vCPU の量\n0.25\n0.5\n1\n2\n4\n8\n16\n32",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "0.25",
        "options": [
          {
            "value": "0.25",
            "label": "0.25"
          },
          {
            "value": "0.5",
            "label": "0.5"
          },
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "16",
            "label": "16"
          },
          {
            "value": "32",
            "label": "32"
          }
        ],
        "value": "0.25",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--linuxMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "0.5",
        "max": "244",
        "step": "any",
        "disabled": true,
        "role": null,
        "controlValue": "0.5",
        "options": null,
        "value": "0.5",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--windowsVcpuPerTask",
        "label": "割り当てられた vCPU の量\n1\n2\n4",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          }
        ],
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--windowsMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "2",
        "max": "30",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--ephemeralStorageGb",
        "label": "Amazon ECS に割り当てられたエフェメラルストレージの量 (GB)",
        "type": "number",
        "min": "20",
        "max": "200",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "20",
        "options": null,
        "value": "20",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAWS Fargate\n行名を編集\n\t\nAWS Fargate\noperatingSystem: Windows · cpuArchitecture: x86 · tasksPerDay: 1000 · averageDurationHours: 0.083333333333333333333 · linuxVcpuPerTask: 0.25 · linuxMemoryGbPerTask: 0.5 · windowsVcpuPerTask: 1 · windowsMemoryGbPerTask: 4 · ephemeralStorageGb: 20\n$328.45\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$328.45\nBaselineとの差額: $0.00\nAWS Fargate\n×\n\nPricing Limitationあり\n\n利用方式\nFargate オンデマンド\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nオペレーティングシステム\nLinux\nWindows\nAWS Pricing Calculator の Operating system。購入方式はリポジトリ方針により On-Demand 固定です。\nCPU アーキテクチャ\nx86\nARM\nLinux は x86 / ARM を選択できます。Windows Fargate は x86 のみです。\nタスクまたはポッドの数 (件/日)\n1日あたりに実行する Amazon ECS task / Amazon EKS pod の数。月間件数は「共通月間時間 ÷ 24」日で換算します。既定730時間では730/24日、30日で見積もる場合は共通月間時間を720時間にしてください。\n平均期間 (時間)\n1 task / podあたりの平均実行時間は0より大きい値。Linux最低1分・Windows最低5分の課金時間は計算時に適用します。\n割り当てられた vCPU の量\n0.25\n0.5\n1\n2\n4\n8\n16\n32\nLinux Fargate の task/pod あたり vCPU。memory との組み合わせは AWS Fargate の supported configurations に従ってください。\n割り当てたメモリ量 (GB)\nAWS対応構成を指定してください: 0.25 vCPUは0.5/1/2 GB、0.5 vCPUは1〜4 GB、1 vCPUは2〜8 GB、2 vCPUは4〜16 GB、4 vCPUは8〜30 GB（以上は整数）、8 vCPUは16〜60 GB・4 GB刻み、16 vCPUは32〜120 GB・8 GB刻み、32 vCPUは60/120/244 GBです。構成作成可否の完全な検証は行いません。\n割り当てられた vCPU の量\n1\n2\n4\nWindows Fargate は x86 の 1 / 2 / 4 vCPU 構成を対象にします。\n割り当てたメモリ量 (GB)\nWindows Fargateはx86のみです。1 vCPUは2〜8 GB、2 vCPUは4〜16 GB、4 vCPUは8〜30 GBの整数メモリを指定してください。構成作成可否の完全な検証は行いません。\nAmazon ECS に割り当てられたエフェメラルストレージの量 (GB)\n20 GB は基本料金に含まれ、20 GB を超える追加 ephemeral storage のみを課金します。\nLinux x86 vCPU\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux x86 メモリ\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux ARM vCPU\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux ARM メモリ\n\n無効中（値は保持され、計算から除外されます）\n\n—\nWindows vCPU\n$147.38\nWindows メモリ\n$64.48\nWindows OS ライセンス\n$116.60\n追加のエフェメラルストレージ (Linux)\n\n無効中（値は保持され、計算から除外されます）\n\n—\n追加のエフェメラルストレージ (Windows)\n$0.00\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "linux-x86-vcpu",
        "title": "Linux x86 vCPU",
        "monthly": "—"
      },
      {
        "id": "linux-x86-memory",
        "title": "Linux x86 メモリ",
        "monthly": "—"
      },
      {
        "id": "linux-arm-vcpu",
        "title": "Linux ARM vCPU",
        "monthly": "—"
      },
      {
        "id": "linux-arm-memory",
        "title": "Linux ARM メモリ",
        "monthly": "—"
      },
      {
        "id": "windows-vcpu",
        "title": "Windows vCPU",
        "monthly": "$147.38"
      },
      {
        "id": "windows-memory",
        "title": "Windows メモリ",
        "monthly": "$64.48"
      },
      {
        "id": "windows-os",
        "title": "Windows OS ライセンス",
        "monthly": "$116.60"
      },
      {
        "id": "linux-ephemeral-storage",
        "title": "追加のエフェメラルストレージ (Linux)",
        "monthly": "—"
      },
      {
        "id": "windows-ephemeral-storage",
        "title": "追加のエフェメラルストレージ (Windows)",
        "monthly": "$0.00"
      }
    ],
    "screen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-baseline-1791950263618-local.png",
    "totalScreen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-baseline-1791950263618-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$328.45",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsBefore": {
    "observedAt": "2026-10-14T03:58:06.941Z",
    "url": "https://calculator.aws/#/createCalculator/Fargate",
    "monthlyDisplay": "354.74",
    "monthlyUsd": "354.74",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "354.74",
      "354.74"
    ],
    "inputs": [
      {
        "id": "formField92-1791950267843-9633",
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
        "id": "formField94-1791950267846-9362",
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
        "id": "formField107-1791950267850-158",
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
        "id": "formField153-1791950267900-6527",
        "label": "Operating system",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791950267902-5185",
        "label": "CPU Architecture",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField128-1791950267864-8621",
        "label": "Number of tasks or pods Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField130-1791950267864-4118",
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
        "id": "formField141-1791950267866-3481",
        "label": "Average duration Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "300",
        "options": null,
        "value": "300",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField143-1791950267867-2470",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField173-1791950267907-9473",
        "label": "Amount of vCPU allocated",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField185-1791950267909-9901",
        "label": "Amount of memory allocated Value",
        "type": "number",
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
        "id": "formField187-1791950267910-8055",
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
      }
    ],
    "warnings": [
      "Enter the time period for which your tasks or pods are running. Pricing is per second with a 1-minute minimum (Linux) and a 5-minute minimum (Windows). Duration is calculated from the time you start to download your container image (docker pull) until the Task or Pod terminates, rounded up to the nearest second."
    ],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure AWS Fargate\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nOn Demand\nInfo\nFargate Spot and Compute Savings Plans are currently not supported on the AWS Pricing Calculator.\nWith AWS Fargate, there are no upfront payments and you only pay for the resources that you use. Pricing is based on requested vCPU, memory, and storage resources consumed by your Amazon ECS Task or Amazon EKS Pod.\nOperating system\nWindows\nCPU Architecture\nx86\nNumber of tasks or pods\nEnter the number of tasks or pods running for your application\nValue\nUnit\nper day\nAverage duration\nEnter the time period for which your tasks or pods are running. Pricing is per second with a 1-minute minimum (Linux) and a 5-minute minimum (Windows). Duration is calculated from the time you start to download your container image (docker pull) until the Task or Pod terminates, rounded up to the nearest second.\nValue\nUnit\nseconds\nAmount of vCPU allocated\nEnter the amount between 0.25 vCPU and 16 vCPU\n1\nvCPU selected supports memory values between 2 GB and 8 GB, in 1 GB increments\nAmount of memory allocated\nUnit\nGB\nShow calculations\nUnit conversions management events\nNumber of tasks or pods: 1000 per day * (730 hours in a month / 24 hours in a day) = 30416.67 per month\nAverage duration: 300 seconds = 0.09 hours\nPricing calculations\n30,416.67 tasks x 1 vCPU x 0.09 hours x 0.058144 USD per hour = 159.17 USD for vCPU hours\n30,416.67 tasks x 1 vCPU x 0.09 hours x 0.046 USD per vCPU per hour = 125.93 USD for OS license (Windows)\n30,416.67 tasks x 4.00 GB x 0.09 hours x 0.0063595 USD per GB per hour = 69.64 USD for GB hours\n159.17 USD for vCPU hours + 125.93 USD for OS license (Windows) + 69.64 USD for GB hours = 354.74 USD total\nFargate cost (monthly): 354.74 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 354.74 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-baseline-1791950263618-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "localAfter": {
    "observedAt": "2026-10-14T03:58:08.932Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$329.55",
    "monthlyUsd": "329.55",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "329.55",
      "329.55"
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
        "label": "利用方式\nFargate オンデマンド",
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
            "label": "Fargate オンデマンド"
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
        "id": "input-profile--operatingSystem",
        "label": "オペレーティングシステム\nLinux\nWindows",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "Windows",
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
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--cpuArchitecture",
        "label": "CPU アーキテクチャ\nx86\nARM",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "x86",
        "options": [
          {
            "value": "x86",
            "label": "x86"
          },
          {
            "value": "ARM",
            "label": "ARM"
          }
        ],
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--tasksPerDay",
        "label": "タスクまたはポッドの数 (件/日)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--averageDurationHours",
        "label": "平均期間 (時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "0.083611111111111111111",
        "options": null,
        "value": "0.083611111111111111111",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--linuxVcpuPerTask",
        "label": "割り当てられた vCPU の量\n0.25\n0.5\n1\n2\n4\n8\n16\n32",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "0.25",
        "options": [
          {
            "value": "0.25",
            "label": "0.25"
          },
          {
            "value": "0.5",
            "label": "0.5"
          },
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "16",
            "label": "16"
          },
          {
            "value": "32",
            "label": "32"
          }
        ],
        "value": "0.25",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--linuxMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "0.5",
        "max": "244",
        "step": "any",
        "disabled": true,
        "role": null,
        "controlValue": "0.5",
        "options": null,
        "value": "0.5",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--windowsVcpuPerTask",
        "label": "割り当てられた vCPU の量\n1\n2\n4",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          }
        ],
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--windowsMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "2",
        "max": "30",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--ephemeralStorageGb",
        "label": "Amazon ECS に割り当てられたエフェメラルストレージの量 (GB)",
        "type": "number",
        "min": "20",
        "max": "200",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "20",
        "options": null,
        "value": "20",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAWS Fargate\n行名を編集\n\t\nAWS Fargate\noperatingSystem: Windows · cpuArchitecture: x86 · tasksPerDay: 1000 · averageDurationHours: 0.083611111111111111111 · linuxVcpuPerTask: 0.25 · linuxMemoryGbPerTask: 0.5 · windowsVcpuPerTask: 1 · windowsMemoryGbPerTask: 4 · ephemeralStorageGb: 20\n$329.55\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$329.55\nBaselineとの差額: $0.00\nAWS Fargate\n×\n\nPricing Limitationあり\n\n利用方式\nFargate オンデマンド\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nオペレーティングシステム\nLinux\nWindows\nAWS Pricing Calculator の Operating system。購入方式はリポジトリ方針により On-Demand 固定です。\nCPU アーキテクチャ\nx86\nARM\nLinux は x86 / ARM を選択できます。Windows Fargate は x86 のみです。\nタスクまたはポッドの数 (件/日)\n1日あたりに実行する Amazon ECS task / Amazon EKS pod の数。月間件数は「共通月間時間 ÷ 24」日で換算します。既定730時間では730/24日、30日で見積もる場合は共通月間時間を720時間にしてください。\n平均期間 (時間)\n1 task / podあたりの平均実行時間は0より大きい値。Linux最低1分・Windows最低5分の課金時間は計算時に適用します。\n割り当てられた vCPU の量\n0.25\n0.5\n1\n2\n4\n8\n16\n32\nLinux Fargate の task/pod あたり vCPU。memory との組み合わせは AWS Fargate の supported configurations に従ってください。\n割り当てたメモリ量 (GB)\nAWS対応構成を指定してください: 0.25 vCPUは0.5/1/2 GB、0.5 vCPUは1〜4 GB、1 vCPUは2〜8 GB、2 vCPUは4〜16 GB、4 vCPUは8〜30 GB（以上は整数）、8 vCPUは16〜60 GB・4 GB刻み、16 vCPUは32〜120 GB・8 GB刻み、32 vCPUは60/120/244 GBです。構成作成可否の完全な検証は行いません。\n割り当てられた vCPU の量\n1\n2\n4\nWindows Fargate は x86 の 1 / 2 / 4 vCPU 構成を対象にします。\n割り当てたメモリ量 (GB)\nWindows Fargateはx86のみです。1 vCPUは2〜8 GB、2 vCPUは4〜16 GB、4 vCPUは8〜30 GBの整数メモリを指定してください。構成作成可否の完全な検証は行いません。\nAmazon ECS に割り当てられたエフェメラルストレージの量 (GB)\n20 GB は基本料金に含まれ、20 GB を超える追加 ephemeral storage のみを課金します。\nLinux x86 vCPU\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux x86 メモリ\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux ARM vCPU\n\n無効中（値は保持され、計算から除外されます）\n\n—\nLinux ARM メモリ\n\n無効中（値は保持され、計算から除外されます）\n\n—\nWindows vCPU\n$147.87\nWindows メモリ\n$64.69\nWindows OS ライセンス\n$116.99\n追加のエフェメラルストレージ (Linux)\n\n無効中（値は保持され、計算から除外されます）\n\n—\n追加のエフェメラルストレージ (Windows)\n$0.00\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "linux-x86-vcpu",
        "title": "Linux x86 vCPU",
        "monthly": "—"
      },
      {
        "id": "linux-x86-memory",
        "title": "Linux x86 メモリ",
        "monthly": "—"
      },
      {
        "id": "linux-arm-vcpu",
        "title": "Linux ARM vCPU",
        "monthly": "—"
      },
      {
        "id": "linux-arm-memory",
        "title": "Linux ARM メモリ",
        "monthly": "—"
      },
      {
        "id": "windows-vcpu",
        "title": "Windows vCPU",
        "monthly": "$147.87"
      },
      {
        "id": "windows-memory",
        "title": "Windows メモリ",
        "monthly": "$64.69"
      },
      {
        "id": "windows-os",
        "title": "Windows OS ライセンス",
        "monthly": "$116.99"
      },
      {
        "id": "linux-ephemeral-storage",
        "title": "追加のエフェメラルストレージ (Linux)",
        "monthly": "—"
      },
      {
        "id": "windows-ephemeral-storage",
        "title": "追加のエフェメラルストレージ (Windows)",
        "monthly": "$0.00"
      }
    ],
    "screen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-after-1791950263618-local.png",
    "totalScreen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-after-1791950263618-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$329.55",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsAfter": {
    "observedAt": "2026-10-14T03:58:11.102Z",
    "url": "https://calculator.aws/#/createCalculator/Fargate",
    "monthlyDisplay": "354.74",
    "monthlyUsd": "354.74",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "354.74",
      "354.74"
    ],
    "inputs": [
      {
        "id": "formField92-1791950267843-9633",
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
        "id": "formField94-1791950267846-9362",
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
        "id": "formField107-1791950267850-158",
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
        "id": "formField153-1791950267900-6527",
        "label": "Operating system",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791950267902-5185",
        "label": "CPU Architecture",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField128-1791950267864-8621",
        "label": "Number of tasks or pods Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField130-1791950267864-4118",
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
        "id": "formField141-1791950267866-3481",
        "label": "Average duration Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "301",
        "options": null,
        "value": "301",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField143-1791950267867-2470",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField173-1791950267907-9473",
        "label": "Amount of vCPU allocated",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField185-1791950267909-9901",
        "label": "Amount of memory allocated Value",
        "type": "number",
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
        "id": "formField187-1791950267910-8055",
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
      }
    ],
    "warnings": [
      "Enter the time period for which your tasks or pods are running. Pricing is per second with a 1-minute minimum (Linux) and a 5-minute minimum (Windows). Duration is calculated from the time you start to download your container image (docker pull) until the Task or Pod terminates, rounded up to the nearest second."
    ],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure AWS Fargate\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nOn Demand\nInfo\nFargate Spot and Compute Savings Plans are currently not supported on the AWS Pricing Calculator.\nWith AWS Fargate, there are no upfront payments and you only pay for the resources that you use. Pricing is based on requested vCPU, memory, and storage resources consumed by your Amazon ECS Task or Amazon EKS Pod.\nOperating system\nWindows\nCPU Architecture\nx86\nNumber of tasks or pods\nEnter the number of tasks or pods running for your application\nValue\nUnit\nper day\nAverage duration\nEnter the time period for which your tasks or pods are running. Pricing is per second with a 1-minute minimum (Linux) and a 5-minute minimum (Windows). Duration is calculated from the time you start to download your container image (docker pull) until the Task or Pod terminates, rounded up to the nearest second.\nValue\nUnit\nseconds\nAmount of vCPU allocated\nEnter the amount between 0.25 vCPU and 16 vCPU\n1\nvCPU selected supports memory values between 2 GB and 8 GB, in 1 GB increments\nAmount of memory allocated\nUnit\nGB\nShow calculations\nUnit conversions management events\nNumber of tasks or pods: 1000 per day * (730 hours in a month / 24 hours in a day) = 30416.67 per month\nAverage duration: 301 seconds = 0.09 hours\nPricing calculations\n30,416.67 tasks x 1 vCPU x 0.09 hours x 0.058144 USD per hour = 159.17 USD for vCPU hours\n30,416.67 tasks x 1 vCPU x 0.09 hours x 0.046 USD per vCPU per hour = 125.93 USD for OS license (Windows)\n30,416.67 tasks x 4.00 GB x 0.09 hours x 0.0063595 USD per GB per hour = 69.64 USD for GB hours\n159.17 USD for vCPU hours + 125.93 USD for OS license (Windows) + 69.64 USD for GB hours = 354.74 USD total\nFargate cost (monthly): 354.74 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 354.74 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/fargate-standard-ap-northeast-1-input-profile--averageDurationHours-delta-fargate-after-windows-300-signal-after-1791950263618-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "publicBuildId": "20261013T095030Z-78197541",
  "localDeltaUsd": "1.10",
  "awsDeltaUsd": "0.00",
  "beforeDifferenceUsd": "-26.29",
  "afterDifferenceUsd": "-25.19",
  "deltaDifferenceUsd": "1.1",
  "reason": "Configured inputs produced a total or delta difference above $0.01; investigate math and equivalence before attributing root cause.",
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
        "label": "利用方式\nFargate オンデマンド",
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
            "label": "Fargate オンデマンド"
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
        "id": "input-profile--operatingSystem",
        "label": "オペレーティングシステム\nLinux\nWindows",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "Windows",
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
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--cpuArchitecture",
        "label": "CPU アーキテクチャ\nx86\nARM",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "x86",
        "options": [
          {
            "value": "x86",
            "label": "x86"
          },
          {
            "value": "ARM",
            "label": "ARM"
          }
        ],
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--tasksPerDay",
        "label": "タスクまたはポッドの数 (件/日)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--averageDurationHours",
        "label": "平均期間 (時間)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "0.083333333333333333333",
        "options": null,
        "value": "0.083333333333333333333",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--linuxVcpuPerTask",
        "label": "割り当てられた vCPU の量\n0.25\n0.5\n1\n2\n4\n8\n16\n32",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": true,
        "role": null,
        "controlValue": "0.25",
        "options": [
          {
            "value": "0.25",
            "label": "0.25"
          },
          {
            "value": "0.5",
            "label": "0.5"
          },
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "16",
            "label": "16"
          },
          {
            "value": "32",
            "label": "32"
          }
        ],
        "value": "0.25",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--linuxMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "0.5",
        "max": "244",
        "step": "any",
        "disabled": true,
        "role": null,
        "controlValue": "0.5",
        "options": null,
        "value": "0.5",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--windowsVcpuPerTask",
        "label": "割り当てられた vCPU の量\n1\n2\n4",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          }
        ],
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--windowsMemoryGbPerTask",
        "label": "割り当てたメモリ量 (GB)",
        "type": "number",
        "min": "2",
        "max": "30",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "4",
        "options": null,
        "value": "4",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--ephemeralStorageGb",
        "label": "Amazon ECS に割り当てられたエフェメラルストレージの量 (GB)",
        "type": "number",
        "min": "20",
        "max": "200",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "20",
        "options": null,
        "value": "20",
        "visible": true,
        "invalid": "false"
      }
    ],
    "aws": [
      {
        "id": "formField92-1791950267843-9633",
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
        "id": "formField94-1791950267846-9362",
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
        "id": "formField107-1791950267850-158",
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
        "id": "formField153-1791950267900-6527",
        "label": "Operating system",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "Windows",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField163-1791950267902-5185",
        "label": "CPU Architecture",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "x86",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField128-1791950267864-8621",
        "label": "Number of tasks or pods Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1000",
        "options": null,
        "value": "1000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField130-1791950267864-4118",
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
        "id": "formField141-1791950267866-3481",
        "label": "Average duration Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "300",
        "options": null,
        "value": "300",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField143-1791950267867-2470",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField173-1791950267907-9473",
        "label": "Amount of vCPU allocated",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "options": null,
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField185-1791950267909-9901",
        "label": "Amount of memory allocated Value",
        "type": "number",
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
        "id": "formField187-1791950267910-8055",
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
      }
    ]
  },
  "measurementVerdict": "FAIL",
  "guiInputApplicationChecks": [
    {
      "label": "Number of tasks or pods Value",
      "desired": "1000",
      "rendered": "1000",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Average duration Value",
      "desired": "300",
      "rendered": "300",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Amount of memory allocated Value",
      "desired": "4",
      "rendered": "4",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Average duration Value",
      "desired": "301",
      "rendered": "301",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    }
  ],
  "finishedAt": "2026-10-14T03:58:11.104Z",
  "componentComparisons": [
    {
      "when": "Before",
      "localComponentIds": [
        "windows-os"
      ],
      "localDisplayedCosts": [
        "$116.60"
      ],
      "localDisplayIntervalUsd": [
        "116.60",
        "116.60"
      ],
      "officialDisplayedLine": "= 125.93 USD for OS license (Windows)",
      "officialDisplayUsd": "125.93",
      "distanceUsd": "9.33",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "linux-x86-vcpu",
        "linux-arm-vcpu",
        "windows-vcpu"
      ],
      "localDisplayedCosts": [
        "$147.38"
      ],
      "localDisplayIntervalUsd": [
        "147.38",
        "147.38"
      ],
      "officialDisplayedLine": "= 159.17 USD for vCPU hours",
      "officialDisplayUsd": "159.17",
      "distanceUsd": "11.79",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "linux-x86-memory",
        "linux-arm-memory",
        "windows-memory"
      ],
      "localDisplayedCosts": [
        "$64.48"
      ],
      "localDisplayIntervalUsd": [
        "64.48",
        "64.48"
      ],
      "officialDisplayedLine": "= 69.64 USD for GB hours",
      "officialDisplayUsd": "69.64",
      "distanceUsd": "5.16",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "windows-os"
      ],
      "localDisplayedCosts": [
        "$116.99"
      ],
      "localDisplayIntervalUsd": [
        "116.99",
        "116.99"
      ],
      "officialDisplayedLine": "= 125.93 USD for OS license (Windows)",
      "officialDisplayUsd": "125.93",
      "distanceUsd": "8.94",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "linux-x86-vcpu",
        "linux-arm-vcpu",
        "windows-vcpu"
      ],
      "localDisplayedCosts": [
        "$147.87"
      ],
      "localDisplayIntervalUsd": [
        "147.87",
        "147.87"
      ],
      "officialDisplayedLine": "= 159.17 USD for vCPU hours",
      "officialDisplayUsd": "159.17",
      "distanceUsd": "11.30",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "linux-x86-memory",
        "linux-arm-memory",
        "windows-memory"
      ],
      "localDisplayedCosts": [
        "$64.69"
      ],
      "localDisplayIntervalUsd": [
        "64.69",
        "64.69"
      ],
      "officialDisplayedLine": "= 69.64 USD for GB hours",
      "officialDisplayUsd": "69.64",
      "distanceUsd": "4.95",
      "verdict": "FAIL",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    }
  ],
  "componentComparisonComplete": true,
  "totalComparisonVerdict": "FAIL",
  "equalityKind": "ROUNDING_TOLERANCE",
  "directionComparison": {
    "local": "increase",
    "official": "unchanged"
  },
  "observedInputChanges": {
    "local": [
      {
        "key": "input-profile--averageDurationHours|0",
        "label": "平均期間 (時間)",
        "id": "input-profile--averageDurationHours",
        "before": "0.083333333333333333333",
        "after": "0.083611111111111111111",
        "added": false
      }
    ],
    "aws": [
      {
        "key": "Average duration Value|number|0",
        "label": "Average duration Value",
        "id": "formField141-1791950267866-3481",
        "before": "300",
        "after": "301",
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
  "boundaryInvestigation": {
    "observedNativeCostLines": {
      "awsBefore": [
        "30,416.67 tasks x 1 vCPU x 0.09 hours x 0.058144 USD per hour = 159.17 USD for vCPU hours",
        "30,416.67 tasks x 1 vCPU x 0.09 hours x 0.046 USD per vCPU per hour = 125.93 USD for OS license (Windows)",
        "30,416.67 tasks x 4.00 GB x 0.09 hours x 0.0063595 USD per GB per hour = 69.64 USD for GB hours"
      ],
      "awsAfter": [
        "30,416.67 tasks x 1 vCPU x 0.09 hours x 0.058144 USD per hour = 159.17 USD for vCPU hours",
        "30,416.67 tasks x 1 vCPU x 0.09 hours x 0.046 USD per vCPU per hour = 125.93 USD for OS license (Windows)",
        "30,416.67 tasks x 4.00 GB x 0.09 hours x 0.0063595 USD per GB per hour = 69.64 USD for GB hours"
      ]
    },
    "sourceOfTruth": [
      "docs/SPEC.md §6.3",
      "docs/SPEC.md §12",
      "docs/uat/AWS_CALCULATOR_PARITY.md §7"
    ],
    "instruction": "Investigate the official GUI rounded billing-duration calculation against the application per-task second minimum and decimal-safe arithmetic contract. A displayed cost difference alone does not establish a public unit-price defect. Do not change application intermediate rounding merely to imitate official displayed calculations. Any unavoidable semantic change needs separate specification resolution by the future fix owner."
  },
  "pagesCommitSha": "b51df2118aee65f2631db653e3bd01df56da091a",
  "officialFieldIds": [
    "fargate:aws:Average-duration-Value-number-0-048c1d1302"
  ],
  "localFieldIds": [
    "fargate:input-profile--averageDurationHours"
  ],
  "inputMetadataLimitation": "GUI input and unit equivalence assessed for measured cases only. Full defaults, candidates, ranges and conditional-parent combinations are not yet exhausted; case-level pricing PASS does not certify full input metadata.",
  "warningsAndLimitations": [
    "Input metadata and complete service parity not certified by a pricing PASS."
  ]
}
```
