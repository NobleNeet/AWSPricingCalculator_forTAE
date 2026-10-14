# redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: redshift。Profile: "serverless"。Region: "ap-northeast-1"。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/Redshift。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-13T23:47:14.103Z。公開build: 20261013T095030Z-78197541。
不具合観測: Equivalent units and configured inputs; displayed total and delta within $0.01.
入力判定: FAIL。料金判定: PASS。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/redshift/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal",
  "serviceId": "redshift",
  "profile": "serverless",
  "region": "ap-northeast-1",
  "parameter": "input-component-serverless-compute-baseRpu",
  "officialFieldId": "redshift:SELECT:Base RPU",
  "localFieldId": "redshift:input-component-serverless-compute-baseRpu",
  "correspondenceRowId": "redshift:input-component-serverless-compute-baseRpu",
  "comparisonScope": "parent-service",
  "pricingCaseMethod": "Independent new GUI Project and official BrowserContext for each case. Baseline values set through real controls; native numeric input application verified with up to 3 bounded attempts.",
  "inputVerdict": "FAIL",
  "pricingVerdict": "PASS",
  "toleranceUsd": "0.01",
  "plannedInputs": {
    "baseline": [
      {
        "local": "input-component-serverless-compute-runtimeDailyHours",
        "official": "Expected daily runtime (hours) Enter number of hours",
        "officialOccurrence": 0,
        "value": 1
      },
      {
        "local": "input-component-serverless-compute-baseRpu",
        "official": "SELECT:Base RPU",
        "officialOccurrence": 0,
        "value": 128
      },
      {
        "local": "input-component-backup-serverless-backupGb",
        "official": "Additional backup storage Value",
        "officialOccurrence": 0,
        "value": 100
      },
      {
        "local": "input-component-rms-serverless-managedGb",
        "official": "Managed storage size Value",
        "officialOccurrence": 0,
        "value": 100
      }
    ],
    "change": {
      "local": "input-component-serverless-compute-baseRpu",
      "official": "SELECT:Base RPU",
      "before": 128,
      "after": 256
    }
  },
  "inputConversions": {
    "field": "SELECT:Base RPU",
    "optionMap": null,
    "dependentSyncProcedure": null,
    "setupProcedure": "async()=>{await aws.getByRole('radio',{name:'Redshift Serverless',exact:true}).check();}",
    "variant": "serverless",
    "dependentSync": null
  },
  "executionState": "FINISHED",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/Redshift"
  },
  "startedAt": "2026-10-13T23:46:47.238Z",
  "localBefore": {
    "observedAt": "2026-10-13T23:47:09.295Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$1933.69",
    "monthlyUsd": "1933.69",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "1933.69",
      "1933.69"
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
        "value": "14000000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-profile",
        "label": "利用方式\nRedshift\nRedshift Serverless",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "serverless",
        "value": "serverless",
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
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-workloadSize",
        "label": "ワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "Medium",
        "value": "Medium",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-baseRpu",
        "label": "ベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "128",
        "value": "128",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-runtimeDailyHours",
        "label": "想定される1日あたりのランタイム (時間)",
        "type": "number",
        "min": "0",
        "max": "24",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-backup-serverless-backupGb",
        "label": "追加のバックアップストレージ (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-rms-serverless-managedGb",
        "label": "マネージドストレージサイズ (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--transferInGb",
        "label": "特定の宛先へのデータ転送 (IN) (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "0",
        "value": "0",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAmazon Redshift\n行名を編集\n\t\nAmazon Redshift\ntransferInGb: 0 · instanceType: dc2.8xlarge · workloadSize: Medium · baseRpu: 128 · runtimeDailyHours: 1 · backupGb: 100 · managedGb: 100 · nodes: 1 · utilization: 100 · backupGb: 0 · backupGb: 0 · scannedTb: 0 · managedGb: 0\n$1933.69\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$1933.69\nBaselineとの差額: $0.00\nAmazon Redshift\n×\n\nPricing Limitationあり\n\n利用方式\nRedshift\nRedshift Serverless\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nRedshift Serverless\nワークロードのサイズとベース RPU の目安: Small 4–64 RPU / Medium 64–128 RPU / Large 128–256 RPU / Extra Large 256–1024 RPU\nワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large\nベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024\n想定される1日あたりのランタイム (時間)\n$1928.58\nAWS Pricing Calculatorの表示例に合わせて1か月を30.5日として日次ランタイムを月間RPU時間へ換算します。実請求は秒単位かつ最低60秒です。\n追加のバックアップストレージ\n追加のバックアップストレージ (GB)\n$2.50\nRedshift マネージドストレージ\nマネージドストレージサイズ (GB)\n$2.61\nRedshift Data Transfer\n特定の宛先へのデータ転送 (IN) (GB)\nAWS公式Calculatorの特定宛先へのIN転送。Redshiftのリージョン間データ共有（受信側）に対応する有料転送として計上。通常のインターネットからAWSへの流入料金とは異なります。\n$0.00\n\nRedshiftのリージョン間データ共有の受信転送料金。通常のインターネット流入とは異なります。\n\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "serverless-compute",
        "title": "Redshift Serverless",
        "monthly": "$1928.58"
      },
      {
        "id": "backup-serverless",
        "title": "追加のバックアップストレージ",
        "monthly": "$2.50"
      },
      {
        "id": "rms-serverless",
        "title": "Redshift マネージドストレージ",
        "monthly": "$2.61"
      },
      {
        "id": "transfer",
        "title": "Redshift Data Transfer",
        "monthly": "$0.00"
      }
    ],
    "screen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-prepared-before-1791935206246-local.png",
    "totalScreen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-prepared-before-1791935206246-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$1933.69",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsBefore": {
    "observedAt": "2026-10-13T23:47:10.154Z",
    "url": "https://calculator.aws/#/createCalculator/Redshift",
    "monthlyDisplay": "1,933.69",
    "monthlyUsd": "1933.69",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "1933.69",
      "1933.69"
    ],
    "inputs": [
      {
        "id": "formField92-1791935212509-7054",
        "label": "Description - optional",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField94-1791935212512-3111",
        "label": "Choose a location typeInfo",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Region",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField107-1791935212516-6177",
        "label": "Choose a Region",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Asia Pacific (Tokyo)",
        "visible": true,
        "invalid": null
      },
      {
        "id": "119-1791935212527-2821",
        "label": "Redshift",
        "type": "radio",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "redshift",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "120-1791935212528-6796",
        "label": "Redshift Serverless",
        "type": "radio",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "redshift_serverless",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField280-1791935212617-8849",
        "label": "Workload size",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Medium",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField290-1791935212619-7863",
        "label": "Base RPU",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "128",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField212-1791935212554-9080",
        "label": "Expected daily runtime (hours) Enter number of hours",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField222-1791935212556-5065",
        "label": "Additional backup storage Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField224-1791935212556-784",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField243-1791935212559-3468",
        "label": "Managed storage size Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField245-1791935212559-1784",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField263-1791935212561-6052",
        "label": "Data Transfer In To Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField265-1791935212562-424",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      }
    ],
    "warnings": [],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Amazon Redshift\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nRedshift\nRedshift Serverless\nRedshift Serverless\nBased on your workload size to get the best price-performance, AWS recommend the following:\nWorkload size\tBase RPU\nSmall\t4-64\nMedium\t64-128\nLarge\t128-256\nExtra Large\t256-1024\nWorkload size\nMedium\nBase RPU\nAmazon Redshift Serverless processing units (RPUs) ranging from 4 to 1,024 are available in select AWS Regions.\n128\nExpected daily runtime (hours)\nShow calculations\n128 RPUs x 1 hours x 0.494 USD x 30.5 days in a month = 1,928.58 USD\nRedshift Serverless cost (monthly): 1,928.58 USD\nAdditional backup storage\nInfo\nAdditional backup storage\nUnit\nGB\nShow calculations\nTiered price for: 100 GB\n100 GB x 0.025 USD = 2.50 USD\nTotal tier cost = 2.50 USD (Additional backup storage cost)\nAdditional backup storage cost (monthly): 2.50 USD\nRedshift Managed Storage\nInfo\nManaged storage size\nCurrently managed storage is only offered on ra3 instances\nValue\nUnit\nGB\nShow calculations\n100 GB x 0.0261 USD = 2.61 USD (Redshift managed storage cost)\nRedshift Managed Storage cost (monthly): 2.61 USD\nRedshift Data Transfer\nInfo\nData Transfer In To\nUnit\nGB\nShow calculations\nData transfer cost (monthly): 0.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 1,933.69 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-prepared-before-1791935206246-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "localAfter": {
    "observedAt": "2026-10-13T23:47:12.139Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "$3862.26",
    "monthlyUsd": "3862.26",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "3862.26",
      "3862.26"
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
        "value": "14000000",
        "visible": true,
        "invalid": null
      },
      {
        "id": "drawer-profile",
        "label": "利用方式\nRedshift\nRedshift Serverless",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "serverless",
        "value": "serverless",
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
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-workloadSize",
        "label": "ワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "Medium",
        "value": "Medium",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-baseRpu",
        "label": "ベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "256",
        "value": "256",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-component-serverless-compute-runtimeDailyHours",
        "label": "想定される1日あたりのランタイム (時間)",
        "type": "number",
        "min": "0",
        "max": "24",
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-backup-serverless-backupGb",
        "label": "追加のバックアップストレージ (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-component-rms-serverless-managedGb",
        "label": "マネージドストレージサイズ (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--transferInGb",
        "label": "特定の宛先へのデータ転送 (IN) (GB)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "0",
        "value": "0",
        "visible": true,
        "invalid": "false"
      }
    ],
    "warnings": "Pricing Limitationあり",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nAmazon Redshift\n行名を編集\n\t\nAmazon Redshift\ntransferInGb: 0 · instanceType: dc2.8xlarge · workloadSize: Medium · baseRpu: 256 · runtimeDailyHours: 1 · backupGb: 100 · managedGb: 100 · nodes: 1 · utilization: 100 · backupGb: 0 · backupGb: 0 · scannedTb: 0 · managedGb: 0\n$3862.26\nPricing Limitationあり\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n月額合計\n$3862.26\nBaselineとの差額: $0.00\nAmazon Redshift\n×\n\nPricing Limitationあり\n\n利用方式\nRedshift\nRedshift Serverless\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nRedshift Serverless\nワークロードのサイズとベース RPU の目安: Small 4–64 RPU / Medium 64–128 RPU / Large 128–256 RPU / Extra Large 256–1024 RPU\nワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large\nベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024\n想定される1日あたりのランタイム (時間)\n$3857.15\nAWS Pricing Calculatorの表示例に合わせて1か月を30.5日として日次ランタイムを月間RPU時間へ換算します。実請求は秒単位かつ最低60秒です。\n追加のバックアップストレージ\n追加のバックアップストレージ (GB)\n$2.50\nRedshift マネージドストレージ\nマネージドストレージサイズ (GB)\n$2.61\nRedshift Data Transfer\n特定の宛先へのデータ転送 (IN) (GB)\nAWS公式Calculatorの特定宛先へのIN転送。Redshiftのリージョン間データ共有（受信側）に対応する有料転送として計上。通常のインターネットからAWSへの流入料金とは異なります。\n$0.00\n\nRedshiftのリージョン間データ共有の受信転送料金。通常のインターネット流入とは異なります。\n\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。",
    "components": [
      {
        "id": "serverless-compute",
        "title": "Redshift Serverless",
        "monthly": "$3857.15"
      },
      {
        "id": "backup-serverless",
        "title": "追加のバックアップストレージ",
        "monthly": "$2.50"
      },
      {
        "id": "rms-serverless",
        "title": "Redshift マネージドストレージ",
        "monthly": "$2.61"
      },
      {
        "id": "transfer",
        "title": "Redshift Data Transfer",
        "monthly": "$0.00"
      }
    ],
    "screen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-after-1791935206246-local.png",
    "totalScreen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-after-1791935206246-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "$3862.26",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsAfter": {
    "observedAt": "2026-10-13T23:47:14.102Z",
    "url": "https://calculator.aws/#/createCalculator/Redshift",
    "monthlyDisplay": "3,862.26",
    "monthlyUsd": "3862.26",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "3862.26",
      "3862.26"
    ],
    "inputs": [
      {
        "id": "formField92-1791935212509-7054",
        "label": "Description - optional",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField94-1791935212512-3111",
        "label": "Choose a location typeInfo",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Region",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField107-1791935212516-6177",
        "label": "Choose a Region",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Asia Pacific (Tokyo)",
        "visible": true,
        "invalid": null
      },
      {
        "id": "119-1791935212527-2821",
        "label": "Redshift",
        "type": "radio",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "redshift",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "120-1791935212528-6796",
        "label": "Redshift Serverless",
        "type": "radio",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "redshift_serverless",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField280-1791935212617-8849",
        "label": "Workload size",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "Medium",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField290-1791935212619-7863",
        "label": "Base RPU",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "256",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField212-1791935212554-9080",
        "label": "Expected daily runtime (hours) Enter number of hours",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField222-1791935212556-5065",
        "label": "Additional backup storage Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField224-1791935212556-784",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField243-1791935212559-3468",
        "label": "Managed storage size Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "100",
        "value": "100",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField245-1791935212559-1784",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField263-1791935212561-6052",
        "label": "Data Transfer In To Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField265-1791935212562-424",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB",
        "visible": true,
        "invalid": null
      }
    ],
    "warnings": [],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Amazon Redshift\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nRedshift\nRedshift Serverless\nRedshift Serverless\nBased on your workload size to get the best price-performance, AWS recommend the following:\nWorkload size\tBase RPU\nSmall\t4-64\nMedium\t64-128\nLarge\t128-256\nExtra Large\t256-1024\nWorkload size\nMedium\nBase RPU\nAmazon Redshift Serverless processing units (RPUs) ranging from 4 to 1,024 are available in select AWS Regions.\n256\nExpected daily runtime (hours)\nShow calculations\n256 RPUs x 1 hours x 0.494 USD x 30.5 days in a month = 3,857.15 USD\nRedshift Serverless cost (monthly): 3,857.15 USD\nAdditional backup storage\nInfo\nAdditional backup storage\nUnit\nGB\nShow calculations\nTiered price for: 100 GB\n100 GB x 0.025 USD = 2.50 USD\nTotal tier cost = 2.50 USD (Additional backup storage cost)\nAdditional backup storage cost (monthly): 2.50 USD\nRedshift Managed Storage\nInfo\nManaged storage size\nCurrently managed storage is only offered on ra3 instances\nValue\nUnit\nGB\nShow calculations\n100 GB x 0.0261 USD = 2.61 USD (Redshift managed storage cost)\nRedshift Managed Storage cost (monthly): 2.61 USD\nRedshift Data Transfer\nInfo\nData Transfer In To\nUnit\nGB\nShow calculations\nData transfer cost (monthly): 0.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 3,862.26 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/redshift-serverless-ap-northeast-1-input-component-serverless-compute-baseRpu-delta-serverless-signal-after-1791935206246-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "publicBuildId": "20261013T095030Z-78197541",
  "localDeltaUsd": "1928.57",
  "awsDeltaUsd": "1928.57",
  "beforeDifferenceUsd": "0",
  "afterDifferenceUsd": "0",
  "deltaDifferenceUsd": "0",
  "reason": "Equivalent units and configured inputs; displayed total and delta within $0.01.",
  "invalidGuiInputs": [],
  "measurementVerdict": "PASS",
  "finishedAt": "2026-10-13T23:47:14.103Z",
  "componentComparisons": [
    {
      "when": "Before",
      "localComponentIds": [
        "serverless-compute"
      ],
      "localDisplayedCosts": [
        "$1928.58"
      ],
      "localDisplayIntervalUsd": [
        "1928.58",
        "1928.58"
      ],
      "officialDisplayedLine": "Redshift Serverless cost (monthly): 1,928.58 USD",
      "officialDisplayUsd": "1928.58",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "backup-tiered",
        "backup-rg",
        "backup-serverless"
      ],
      "localDisplayedCosts": [
        "$2.50"
      ],
      "localDisplayIntervalUsd": [
        "2.50",
        "2.50"
      ],
      "officialDisplayedLine": "Additional backup storage cost (monthly): 2.50 USD",
      "officialDisplayUsd": "2.50",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "rms-provisioned",
        "rms-serverless"
      ],
      "localDisplayedCosts": [
        "$2.61"
      ],
      "localDisplayIntervalUsd": [
        "2.61",
        "2.61"
      ],
      "officialDisplayedLine": "Redshift Managed Storage cost (monthly): 2.61 USD",
      "officialDisplayUsd": "2.61",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "transfer"
      ],
      "localDisplayedCosts": [
        "$0.00"
      ],
      "localDisplayIntervalUsd": [
        "0.00",
        "0.00"
      ],
      "officialDisplayedLine": "Data transfer cost (monthly): 0.00 USD",
      "officialDisplayUsd": "0.00",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "serverless-compute"
      ],
      "localDisplayedCosts": [
        "$3857.15"
      ],
      "localDisplayIntervalUsd": [
        "3857.15",
        "3857.15"
      ],
      "officialDisplayedLine": "Redshift Serverless cost (monthly): 3,857.15 USD",
      "officialDisplayUsd": "3857.15",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "backup-tiered",
        "backup-rg",
        "backup-serverless"
      ],
      "localDisplayedCosts": [
        "$2.50"
      ],
      "localDisplayIntervalUsd": [
        "2.50",
        "2.50"
      ],
      "officialDisplayedLine": "Additional backup storage cost (monthly): 2.50 USD",
      "officialDisplayUsd": "2.50",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "rms-provisioned",
        "rms-serverless"
      ],
      "localDisplayedCosts": [
        "$2.61"
      ],
      "localDisplayIntervalUsd": [
        "2.61",
        "2.61"
      ],
      "officialDisplayedLine": "Redshift Managed Storage cost (monthly): 2.61 USD",
      "officialDisplayUsd": "2.61",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "transfer"
      ],
      "localDisplayedCosts": [
        "$0.00"
      ],
      "localDisplayIntervalUsd": [
        "0.00",
        "0.00"
      ],
      "officialDisplayedLine": "Data transfer cost (monthly): 0.00 USD",
      "officialDisplayUsd": "0.00",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    }
  ],
  "componentComparisonComplete": true,
  "totalComparisonVerdict": "PASS",
  "equalityKind": "EXACT_DISPLAY",
  "directionComparison": {
    "local": "increase",
    "official": "increase"
  },
  "observedInputChanges": {
    "local": [
      {
        "key": "input-component-serverless-compute-baseRpu|0",
        "label": "ベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024",
        "id": "input-component-serverless-compute-baseRpu",
        "before": "128",
        "after": "256",
        "added": false
      }
    ],
    "aws": [
      {
        "key": "Base RPU|button|0",
        "label": "Base RPU",
        "id": "formField290-1791935212619-7863",
        "before": "128",
        "after": "256",
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
    "redshift:aws:Base-RPU-button-0-a7074a0ac5"
  ],
  "localFieldIds": [
    "redshift:input-component-serverless-compute-baseRpu"
  ],
  "inputMetadataLimitation": "The independent official GUI menu contains 80 rendered candidates in this observation; public exposes nine powers of two. Native candidates such as 24, 40 and 48 cannot be selected publicly. Candidate-range mismatch is proven for the listed missing values; this count does not certify completeness of any virtualized or conditional candidate list.",
  "warningsAndLimitations": [
    "Input metadata and complete service parity not certified by a pricing PASS."
  ]
}
```
