# redshift-missing-redshift-input-component-serverless-compute-baseRpu-2b58b9fe9d 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: redshift。Profile: {"local": "serverless", "official": {"variant": "selector", "selector": {"id": "formField17907-1791904686670-6067", "value": "128", "label": "Base RPU |  | 128", "base": "Base RPU", "nth": 0}, "value": "320", "options": [{"label": "4", "disabled": null}, {"label": "8", "disabled": null}, {"label": "16", "disabled": null}, {"label": "24", "disabled": null}, {"label": "32", "disabled": null}, {"label": "40", "disabled": null}, {"label": "48", "disabled": null}, {"label": "56", "disabled": null}, {"label": "64", "disabled": null}, {"label": "72", "disabled": null}, {"label": "80", "disabled": null}, {"label": "88", "disabled": null}, {"label": "96", "disabled": null}, {"label": "104", "disabled": null}, {"label": "112", "disabled": null}, {"label": "120", "disabled": null}, {"label": "128", "disabled": null}, {"label": "136", "disabled": null}, {"label": "144", "disabled": null}, {"label": "152", "disabled": null}, {"label": "160", "disabled": null}, {"label": "168", "disabled": null}, {"label": "176", "disabled": null}, {"label": "184", "disabled": null}, {"label": "192", "disabled": null}, {"label": "200", "disabled": null}, {"label": "208", "disabled": null}, {"label": "216", "disabled": null}, {"label": "224", "disabled": null}, {"label": "232", "disabled": null}, {"label": "240", "disabled": null}, {"label": "248", "disabled": null}, {"label": "256", "disabled": null}, {"label": "264", "disabled": null}, {"label": "272", "disabled": null}, {"label": "280", "disabled": null}, {"label": "288", "disabled": null}, {"label": "296", "disabled": null}, {"label": "304", "disabled": null}, {"label": "312", "disabled": null}, {"label": "320", "disabled": null}, {"label": "328", "disabled": null}, {"label": "336", "disabled": null}, {"label": "344", "disabled": null}, {"label": "352", "disabled": null}, {"label": "360", "disabled": null}, {"label": "368", "disabled": null}, {"label": "376", "disabled": null}, {"label": "384", "disabled": null}, {"label": "392", "disabled": null}, {"label": "400", "disabled": null}, {"label": "408", "disabled": null}, {"label": "416", "disabled": null}, {"label": "424", "disabled": null}, {"label": "432", "disabled": null}, {"label": "440", "disabled": null}, {"label": "448", "disabled": null}, {"label": "456", "disabled": null}, {"label": "464", "disabled": null}, {"label": "472", "disabled": null}, {"label": "480", "disabled": null}, {"label": "488", "disabled": null}, {"label": "496", "disabled": null}, {"label": "504", "disabled": null}, {"label": "512", "disabled": null}, {"label": "544", "disabled": null}, {"label": "576", "disabled": null}, {"label": "608", "disabled": null}, {"label": "640", "disabled": null}, {"label": "672", "disabled": null}, {"label": "704", "disabled": null}, {"label": "736", "disabled": null}, {"label": "768", "disabled": null}, {"label": "800", "disabled": null}, {"label": "832", "disabled": null}, {"label": "864", "disabled": null}, {"label": "928", "disabled": null}, {"label": "960", "disabled": null}, {"label": "992", "disabled": null}, {"label": "1024", "disabled": null}], "omitted": [{"label": "8", "disabled": null}, {"label": "16", "disabled": null}, {"label": "24", "disabled": null}, {"label": "32", "disabled": null}, {"label": "40", "disabled": null}, {"label": "48", "disabled": null}, {"label": "56", "disabled": null}, {"label": "64", "disabled": null}, {"label": "72", "disabled": null}, {"label": "80", "disabled": null}, {"label": "88", "disabled": null}, {"label": "96", "disabled": null}, {"label": "104", "disabled": null}, {"label": "112", "disabled": null}, {"label": "120", "disabled": null}, {"label": "128", "disabled": null}, {"label": "136", "disabled": null}, {"label": "144", "disabled": null}, {"label": "152", "disabled": null}, {"label": "160", "disabled": null}, {"label": "168", "disabled": null}, {"label": "176", "disabled": null}, {"label": "184", "disabled": null}, {"label": "192", "disabled": null}, {"label": "200", "disabled": null}, {"label": "208", "disabled": null}, {"label": "216", "disabled": null}, {"label": "224", "disabled": null}, {"label": "232", "disabled": null}, {"label": "240", "disabled": null}, {"label": "248", "disabled": null}, {"label": "256", "disabled": null}, {"label": "264", "disabled": null}, {"label": "272", "disabled": null}, {"label": "280", "disabled": null}, {"label": "288", "disabled": null}, {"label": "296", "disabled": null}, {"label": "304", "disabled": null}, {"label": "312", "disabled": null}, {"label": "328", "disabled": null}, {"label": "336", "disabled": null}, {"label": "344", "disabled": null}, {"label": "352", "disabled": null}, {"label": "360", "disabled": null}, {"label": "368", "disabled": null}, {"label": "376", "disabled": null}, {"label": "384", "disabled": null}, {"label": "392", "disabled": null}, {"label": "400", "disabled": null}, {"label": "408", "disabled": null}, {"label": "416", "disabled": null}, {"label": "424", "disabled": null}, {"label": "432", "disabled": null}, {"label": "440", "disabled": null}, {"label": "448", "disabled": null}, {"label": "456", "disabled": null}, {"label": "464", "disabled": null}, {"label": "472", "disabled": null}, {"label": "480", "disabled": null}, {"label": "488", "disabled": null}, {"label": "496", "disabled": null}, {"label": "504", "disabled": null}, {"label": "512", "disabled": null}, {"label": "544", "disabled": null}, {"label": "576", "disabled": null}, {"label": "608", "disabled": null}, {"label": "640", "disabled": null}, {"label": "672", "disabled": null}, {"label": "704", "disabled": null}, {"label": "736", "disabled": null}, {"label": "768", "disabled": null}, {"label": "800", "disabled": null}, {"label": "832", "disabled": null}, {"label": "864", "disabled": null}, {"label": "928", "disabled": null}, {"label": "960", "disabled": null}, {"label": "992", "disabled": null}], "omissionReason": "First/middle/last; semantic family confirmation remains incomplete", "requestedRegion": null, "region": "us-west-2", "regionDisplay": "US West (Oregon)"}}。Region: {"local": "ap-northeast-1", "official": "us-west-2"}。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/Redshift。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T05:47:06.612753+00:00。公開build: 20261013T095030Z-78197541。
不具合観測: The independent official GUI menu contains 80 rendered candidates in this observation; public exposes nine powers of two. Native candidates such as 24, 40 and 48 cannot be selected publicly. Candidate-range mismatch is proven for the listed missing values; this count does not certify completeness of any virtualized or conditional candidate list.
入力判定: FAIL。料金判定: NOT_COMPARABLE。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/redshift/redshift-missing-redshift-input-component-serverless-compute-baseRpu-2b58b9fe9d.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "redshift-missing-redshift-input-component-serverless-compute-baseRpu-2b58b9fe9d",
  "serviceId": "redshift",
  "profile": {
    "local": "serverless",
    "official": {
      "variant": "selector",
      "selector": {
        "id": "formField17907-1791904686670-6067",
        "value": "128",
        "label": "Base RPU |  | 128",
        "base": "Base RPU",
        "nth": 0
      },
      "value": "320",
      "options": [
        {
          "label": "4",
          "disabled": null
        },
        {
          "label": "8",
          "disabled": null
        },
        {
          "label": "16",
          "disabled": null
        },
        {
          "label": "24",
          "disabled": null
        },
        {
          "label": "32",
          "disabled": null
        },
        {
          "label": "40",
          "disabled": null
        },
        {
          "label": "48",
          "disabled": null
        },
        {
          "label": "56",
          "disabled": null
        },
        {
          "label": "64",
          "disabled": null
        },
        {
          "label": "72",
          "disabled": null
        },
        {
          "label": "80",
          "disabled": null
        },
        {
          "label": "88",
          "disabled": null
        },
        {
          "label": "96",
          "disabled": null
        },
        {
          "label": "104",
          "disabled": null
        },
        {
          "label": "112",
          "disabled": null
        },
        {
          "label": "120",
          "disabled": null
        },
        {
          "label": "128",
          "disabled": null
        },
        {
          "label": "136",
          "disabled": null
        },
        {
          "label": "144",
          "disabled": null
        },
        {
          "label": "152",
          "disabled": null
        },
        {
          "label": "160",
          "disabled": null
        },
        {
          "label": "168",
          "disabled": null
        },
        {
          "label": "176",
          "disabled": null
        },
        {
          "label": "184",
          "disabled": null
        },
        {
          "label": "192",
          "disabled": null
        },
        {
          "label": "200",
          "disabled": null
        },
        {
          "label": "208",
          "disabled": null
        },
        {
          "label": "216",
          "disabled": null
        },
        {
          "label": "224",
          "disabled": null
        },
        {
          "label": "232",
          "disabled": null
        },
        {
          "label": "240",
          "disabled": null
        },
        {
          "label": "248",
          "disabled": null
        },
        {
          "label": "256",
          "disabled": null
        },
        {
          "label": "264",
          "disabled": null
        },
        {
          "label": "272",
          "disabled": null
        },
        {
          "label": "280",
          "disabled": null
        },
        {
          "label": "288",
          "disabled": null
        },
        {
          "label": "296",
          "disabled": null
        },
        {
          "label": "304",
          "disabled": null
        },
        {
          "label": "312",
          "disabled": null
        },
        {
          "label": "320",
          "disabled": null
        },
        {
          "label": "328",
          "disabled": null
        },
        {
          "label": "336",
          "disabled": null
        },
        {
          "label": "344",
          "disabled": null
        },
        {
          "label": "352",
          "disabled": null
        },
        {
          "label": "360",
          "disabled": null
        },
        {
          "label": "368",
          "disabled": null
        },
        {
          "label": "376",
          "disabled": null
        },
        {
          "label": "384",
          "disabled": null
        },
        {
          "label": "392",
          "disabled": null
        },
        {
          "label": "400",
          "disabled": null
        },
        {
          "label": "408",
          "disabled": null
        },
        {
          "label": "416",
          "disabled": null
        },
        {
          "label": "424",
          "disabled": null
        },
        {
          "label": "432",
          "disabled": null
        },
        {
          "label": "440",
          "disabled": null
        },
        {
          "label": "448",
          "disabled": null
        },
        {
          "label": "456",
          "disabled": null
        },
        {
          "label": "464",
          "disabled": null
        },
        {
          "label": "472",
          "disabled": null
        },
        {
          "label": "480",
          "disabled": null
        },
        {
          "label": "488",
          "disabled": null
        },
        {
          "label": "496",
          "disabled": null
        },
        {
          "label": "504",
          "disabled": null
        },
        {
          "label": "512",
          "disabled": null
        },
        {
          "label": "544",
          "disabled": null
        },
        {
          "label": "576",
          "disabled": null
        },
        {
          "label": "608",
          "disabled": null
        },
        {
          "label": "640",
          "disabled": null
        },
        {
          "label": "672",
          "disabled": null
        },
        {
          "label": "704",
          "disabled": null
        },
        {
          "label": "736",
          "disabled": null
        },
        {
          "label": "768",
          "disabled": null
        },
        {
          "label": "800",
          "disabled": null
        },
        {
          "label": "832",
          "disabled": null
        },
        {
          "label": "864",
          "disabled": null
        },
        {
          "label": "928",
          "disabled": null
        },
        {
          "label": "960",
          "disabled": null
        },
        {
          "label": "992",
          "disabled": null
        },
        {
          "label": "1024",
          "disabled": null
        }
      ],
      "omitted": [
        {
          "label": "8",
          "disabled": null
        },
        {
          "label": "16",
          "disabled": null
        },
        {
          "label": "24",
          "disabled": null
        },
        {
          "label": "32",
          "disabled": null
        },
        {
          "label": "40",
          "disabled": null
        },
        {
          "label": "48",
          "disabled": null
        },
        {
          "label": "56",
          "disabled": null
        },
        {
          "label": "64",
          "disabled": null
        },
        {
          "label": "72",
          "disabled": null
        },
        {
          "label": "80",
          "disabled": null
        },
        {
          "label": "88",
          "disabled": null
        },
        {
          "label": "96",
          "disabled": null
        },
        {
          "label": "104",
          "disabled": null
        },
        {
          "label": "112",
          "disabled": null
        },
        {
          "label": "120",
          "disabled": null
        },
        {
          "label": "128",
          "disabled": null
        },
        {
          "label": "136",
          "disabled": null
        },
        {
          "label": "144",
          "disabled": null
        },
        {
          "label": "152",
          "disabled": null
        },
        {
          "label": "160",
          "disabled": null
        },
        {
          "label": "168",
          "disabled": null
        },
        {
          "label": "176",
          "disabled": null
        },
        {
          "label": "184",
          "disabled": null
        },
        {
          "label": "192",
          "disabled": null
        },
        {
          "label": "200",
          "disabled": null
        },
        {
          "label": "208",
          "disabled": null
        },
        {
          "label": "216",
          "disabled": null
        },
        {
          "label": "224",
          "disabled": null
        },
        {
          "label": "232",
          "disabled": null
        },
        {
          "label": "240",
          "disabled": null
        },
        {
          "label": "248",
          "disabled": null
        },
        {
          "label": "256",
          "disabled": null
        },
        {
          "label": "264",
          "disabled": null
        },
        {
          "label": "272",
          "disabled": null
        },
        {
          "label": "280",
          "disabled": null
        },
        {
          "label": "288",
          "disabled": null
        },
        {
          "label": "296",
          "disabled": null
        },
        {
          "label": "304",
          "disabled": null
        },
        {
          "label": "312",
          "disabled": null
        },
        {
          "label": "328",
          "disabled": null
        },
        {
          "label": "336",
          "disabled": null
        },
        {
          "label": "344",
          "disabled": null
        },
        {
          "label": "352",
          "disabled": null
        },
        {
          "label": "360",
          "disabled": null
        },
        {
          "label": "368",
          "disabled": null
        },
        {
          "label": "376",
          "disabled": null
        },
        {
          "label": "384",
          "disabled": null
        },
        {
          "label": "392",
          "disabled": null
        },
        {
          "label": "400",
          "disabled": null
        },
        {
          "label": "408",
          "disabled": null
        },
        {
          "label": "416",
          "disabled": null
        },
        {
          "label": "424",
          "disabled": null
        },
        {
          "label": "432",
          "disabled": null
        },
        {
          "label": "440",
          "disabled": null
        },
        {
          "label": "448",
          "disabled": null
        },
        {
          "label": "456",
          "disabled": null
        },
        {
          "label": "464",
          "disabled": null
        },
        {
          "label": "472",
          "disabled": null
        },
        {
          "label": "480",
          "disabled": null
        },
        {
          "label": "488",
          "disabled": null
        },
        {
          "label": "496",
          "disabled": null
        },
        {
          "label": "504",
          "disabled": null
        },
        {
          "label": "512",
          "disabled": null
        },
        {
          "label": "544",
          "disabled": null
        },
        {
          "label": "576",
          "disabled": null
        },
        {
          "label": "608",
          "disabled": null
        },
        {
          "label": "640",
          "disabled": null
        },
        {
          "label": "672",
          "disabled": null
        },
        {
          "label": "704",
          "disabled": null
        },
        {
          "label": "736",
          "disabled": null
        },
        {
          "label": "768",
          "disabled": null
        },
        {
          "label": "800",
          "disabled": null
        },
        {
          "label": "832",
          "disabled": null
        },
        {
          "label": "864",
          "disabled": null
        },
        {
          "label": "928",
          "disabled": null
        },
        {
          "label": "960",
          "disabled": null
        },
        {
          "label": "992",
          "disabled": null
        }
      ],
      "omissionReason": "First/middle/last; semantic family confirmation remains incomplete",
      "requestedRegion": null,
      "region": "us-west-2",
      "regionDisplay": "US West (Oregon)"
    }
  },
  "region": {
    "local": "ap-northeast-1",
    "official": "us-west-2"
  },
  "parameter": [
    "Base RPU",
    "ベース RPU"
  ],
  "officialFieldIds": [
    "redshift:aws:Base-RPU-button-0-a7074a0ac5"
  ],
  "localFieldIds": [
    "redshift:input-component-serverless-compute-baseRpu"
  ],
  "correspondenceRowId": "redshift:input-component-serverless-compute-baseRpu",
  "comparisonScope": "input availability and metadata; prices unmeasured",
  "inputVerdict": "FAIL",
  "pricingVerdict": "NOT_COMPARABLE",
  "reason": "The independent official GUI menu contains 80 rendered candidates in this observation; public exposes nine powers of two. Native candidates such as 24, 40 and 48 cannot be selected publicly. Candidate-range mismatch is proven for the listed missing values; this count does not certify completeness of any virtualized or conditional candidate list.",
  "executionState": "INPUT_OBSERVATION_RECORDED",
  "observedAt": "2026-10-14T05:47:06.612753+00:00",
  "publicBuildId": "20261013T095030Z-78197541",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/Redshift"
  },
  "allInputs": {
    "localObservation": "observations/local-redshift-102.json",
    "officialObservation": "observations/aws-redshift-390.json",
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
      "file": "observations/local-redshift-102.json",
      "screen": "screenshots/local-redshift-102.png",
      "condition": {
        "profile": {
          "value": "serverless",
          "label": "Redshift Serverless"
        },
        "region": "ap-northeast-1",
        "variant": "selector",
        "selector": "drawer-profile",
        "value": {
          "value": "serverless",
          "label": "Redshift Serverless"
        },
        "omitted": [],
        "omissionReason": null,
        "requestedProfile": {
          "value": "provisioned",
          "label": "Redshift"
        },
        "profileObservedFrom": "drawer-profile DOM value"
      },
      "visible": true,
      "value": "128",
      "domId": "input-component-serverless-compute-baseRpu"
    },
    "aws": {
      "file": "observations/aws-redshift-390.json",
      "screen": "screenshots/aws-redshift-390.png",
      "condition": {
        "variant": "selector",
        "selector": {
          "id": "formField17907-1791904686670-6067",
          "value": "128",
          "label": "Base RPU |  | 128",
          "base": "Base RPU",
          "nth": 0
        },
        "value": "320",
        "options": [
          {
            "label": "4",
            "disabled": null
          },
          {
            "label": "8",
            "disabled": null
          },
          {
            "label": "16",
            "disabled": null
          },
          {
            "label": "24",
            "disabled": null
          },
          {
            "label": "32",
            "disabled": null
          },
          {
            "label": "40",
            "disabled": null
          },
          {
            "label": "48",
            "disabled": null
          },
          {
            "label": "56",
            "disabled": null
          },
          {
            "label": "64",
            "disabled": null
          },
          {
            "label": "72",
            "disabled": null
          },
          {
            "label": "80",
            "disabled": null
          },
          {
            "label": "88",
            "disabled": null
          },
          {
            "label": "96",
            "disabled": null
          },
          {
            "label": "104",
            "disabled": null
          },
          {
            "label": "112",
            "disabled": null
          },
          {
            "label": "120",
            "disabled": null
          },
          {
            "label": "128",
            "disabled": null
          },
          {
            "label": "136",
            "disabled": null
          },
          {
            "label": "144",
            "disabled": null
          },
          {
            "label": "152",
            "disabled": null
          },
          {
            "label": "160",
            "disabled": null
          },
          {
            "label": "168",
            "disabled": null
          },
          {
            "label": "176",
            "disabled": null
          },
          {
            "label": "184",
            "disabled": null
          },
          {
            "label": "192",
            "disabled": null
          },
          {
            "label": "200",
            "disabled": null
          },
          {
            "label": "208",
            "disabled": null
          },
          {
            "label": "216",
            "disabled": null
          },
          {
            "label": "224",
            "disabled": null
          },
          {
            "label": "232",
            "disabled": null
          },
          {
            "label": "240",
            "disabled": null
          },
          {
            "label": "248",
            "disabled": null
          },
          {
            "label": "256",
            "disabled": null
          },
          {
            "label": "264",
            "disabled": null
          },
          {
            "label": "272",
            "disabled": null
          },
          {
            "label": "280",
            "disabled": null
          },
          {
            "label": "288",
            "disabled": null
          },
          {
            "label": "296",
            "disabled": null
          },
          {
            "label": "304",
            "disabled": null
          },
          {
            "label": "312",
            "disabled": null
          },
          {
            "label": "320",
            "disabled": null
          },
          {
            "label": "328",
            "disabled": null
          },
          {
            "label": "336",
            "disabled": null
          },
          {
            "label": "344",
            "disabled": null
          },
          {
            "label": "352",
            "disabled": null
          },
          {
            "label": "360",
            "disabled": null
          },
          {
            "label": "368",
            "disabled": null
          },
          {
            "label": "376",
            "disabled": null
          },
          {
            "label": "384",
            "disabled": null
          },
          {
            "label": "392",
            "disabled": null
          },
          {
            "label": "400",
            "disabled": null
          },
          {
            "label": "408",
            "disabled": null
          },
          {
            "label": "416",
            "disabled": null
          },
          {
            "label": "424",
            "disabled": null
          },
          {
            "label": "432",
            "disabled": null
          },
          {
            "label": "440",
            "disabled": null
          },
          {
            "label": "448",
            "disabled": null
          },
          {
            "label": "456",
            "disabled": null
          },
          {
            "label": "464",
            "disabled": null
          },
          {
            "label": "472",
            "disabled": null
          },
          {
            "label": "480",
            "disabled": null
          },
          {
            "label": "488",
            "disabled": null
          },
          {
            "label": "496",
            "disabled": null
          },
          {
            "label": "504",
            "disabled": null
          },
          {
            "label": "512",
            "disabled": null
          },
          {
            "label": "544",
            "disabled": null
          },
          {
            "label": "576",
            "disabled": null
          },
          {
            "label": "608",
            "disabled": null
          },
          {
            "label": "640",
            "disabled": null
          },
          {
            "label": "672",
            "disabled": null
          },
          {
            "label": "704",
            "disabled": null
          },
          {
            "label": "736",
            "disabled": null
          },
          {
            "label": "768",
            "disabled": null
          },
          {
            "label": "800",
            "disabled": null
          },
          {
            "label": "832",
            "disabled": null
          },
          {
            "label": "864",
            "disabled": null
          },
          {
            "label": "928",
            "disabled": null
          },
          {
            "label": "960",
            "disabled": null
          },
          {
            "label": "992",
            "disabled": null
          },
          {
            "label": "1024",
            "disabled": null
          }
        ],
        "omitted": [
          {
            "label": "8",
            "disabled": null
          },
          {
            "label": "16",
            "disabled": null
          },
          {
            "label": "24",
            "disabled": null
          },
          {
            "label": "32",
            "disabled": null
          },
          {
            "label": "40",
            "disabled": null
          },
          {
            "label": "48",
            "disabled": null
          },
          {
            "label": "56",
            "disabled": null
          },
          {
            "label": "64",
            "disabled": null
          },
          {
            "label": "72",
            "disabled": null
          },
          {
            "label": "80",
            "disabled": null
          },
          {
            "label": "88",
            "disabled": null
          },
          {
            "label": "96",
            "disabled": null
          },
          {
            "label": "104",
            "disabled": null
          },
          {
            "label": "112",
            "disabled": null
          },
          {
            "label": "120",
            "disabled": null
          },
          {
            "label": "128",
            "disabled": null
          },
          {
            "label": "136",
            "disabled": null
          },
          {
            "label": "144",
            "disabled": null
          },
          {
            "label": "152",
            "disabled": null
          },
          {
            "label": "160",
            "disabled": null
          },
          {
            "label": "168",
            "disabled": null
          },
          {
            "label": "176",
            "disabled": null
          },
          {
            "label": "184",
            "disabled": null
          },
          {
            "label": "192",
            "disabled": null
          },
          {
            "label": "200",
            "disabled": null
          },
          {
            "label": "208",
            "disabled": null
          },
          {
            "label": "216",
            "disabled": null
          },
          {
            "label": "224",
            "disabled": null
          },
          {
            "label": "232",
            "disabled": null
          },
          {
            "label": "240",
            "disabled": null
          },
          {
            "label": "248",
            "disabled": null
          },
          {
            "label": "256",
            "disabled": null
          },
          {
            "label": "264",
            "disabled": null
          },
          {
            "label": "272",
            "disabled": null
          },
          {
            "label": "280",
            "disabled": null
          },
          {
            "label": "288",
            "disabled": null
          },
          {
            "label": "296",
            "disabled": null
          },
          {
            "label": "304",
            "disabled": null
          },
          {
            "label": "312",
            "disabled": null
          },
          {
            "label": "328",
            "disabled": null
          },
          {
            "label": "336",
            "disabled": null
          },
          {
            "label": "344",
            "disabled": null
          },
          {
            "label": "352",
            "disabled": null
          },
          {
            "label": "360",
            "disabled": null
          },
          {
            "label": "368",
            "disabled": null
          },
          {
            "label": "376",
            "disabled": null
          },
          {
            "label": "384",
            "disabled": null
          },
          {
            "label": "392",
            "disabled": null
          },
          {
            "label": "400",
            "disabled": null
          },
          {
            "label": "408",
            "disabled": null
          },
          {
            "label": "416",
            "disabled": null
          },
          {
            "label": "424",
            "disabled": null
          },
          {
            "label": "432",
            "disabled": null
          },
          {
            "label": "440",
            "disabled": null
          },
          {
            "label": "448",
            "disabled": null
          },
          {
            "label": "456",
            "disabled": null
          },
          {
            "label": "464",
            "disabled": null
          },
          {
            "label": "472",
            "disabled": null
          },
          {
            "label": "480",
            "disabled": null
          },
          {
            "label": "488",
            "disabled": null
          },
          {
            "label": "496",
            "disabled": null
          },
          {
            "label": "504",
            "disabled": null
          },
          {
            "label": "512",
            "disabled": null
          },
          {
            "label": "544",
            "disabled": null
          },
          {
            "label": "576",
            "disabled": null
          },
          {
            "label": "608",
            "disabled": null
          },
          {
            "label": "640",
            "disabled": null
          },
          {
            "label": "672",
            "disabled": null
          },
          {
            "label": "704",
            "disabled": null
          },
          {
            "label": "736",
            "disabled": null
          },
          {
            "label": "768",
            "disabled": null
          },
          {
            "label": "800",
            "disabled": null
          },
          {
            "label": "832",
            "disabled": null
          },
          {
            "label": "864",
            "disabled": null
          },
          {
            "label": "928",
            "disabled": null
          },
          {
            "label": "960",
            "disabled": null
          },
          {
            "label": "992",
            "disabled": null
          }
        ],
        "omissionReason": "First/middle/last; semantic family confirmation remains incomplete",
        "requestedRegion": null,
        "region": "us-west-2",
        "regionDisplay": "US West (Oregon)"
      },
      "value": "320",
      "domId": "formField17907-1791904686670-6067",
      "section": "",
      "context": "320"
    }
  },
  "specificationEvidence": [
    "docs/uat/AWS_CALCULATOR_PARITY.md §5.1/5.2",
    "docs/SERVICE_ONBOARDING.md §3.1.1/5–6",
    "docs/SPEC.md §2.2"
  ],
  "resumeRequirements": [
    "Verify same public build and current AWS price assumptions",
    "Complete missing parent-condition inventory",
    "Configure an independent equivalent estimate in both real GUIs",
    "Measure baseline and changed monthly totals and components"
  ],
  "correspondenceClassification": "MISMATCHED",
  "candidateComparison": {
    "missingLocalCandidates": [
      "24",
      "40",
      "48",
      "56",
      "72",
      "80",
      "88",
      "96",
      "104",
      "112",
      "120",
      "136",
      "144",
      "152",
      "160",
      "168",
      "176",
      "184",
      "192",
      "200",
      "208",
      "216",
      "224",
      "232",
      "240",
      "248",
      "264",
      "272",
      "280",
      "288",
      "296",
      "304",
      "312",
      "320",
      "328",
      "336",
      "344",
      "352",
      "360",
      "368",
      "376",
      "384",
      "392",
      "400",
      "408",
      "416",
      "424",
      "432",
      "440",
      "448",
      "456",
      "464",
      "472",
      "480",
      "488",
      "496",
      "504",
      "544",
      "576",
      "608",
      "640",
      "672",
      "704",
      "736",
      "768",
      "800",
      "832",
      "864",
      "928",
      "960",
      "992"
    ],
    "observedOfficialOptions": [
      {
        "label": "4",
        "disabled": null
      },
      {
        "label": "8",
        "disabled": null
      },
      {
        "label": "16",
        "disabled": null
      },
      {
        "label": "24",
        "disabled": null
      },
      {
        "label": "32",
        "disabled": null
      },
      {
        "label": "40",
        "disabled": null
      },
      {
        "label": "48",
        "disabled": null
      },
      {
        "label": "56",
        "disabled": null
      },
      {
        "label": "64",
        "disabled": null
      },
      {
        "label": "72",
        "disabled": null
      },
      {
        "label": "80",
        "disabled": null
      },
      {
        "label": "88",
        "disabled": null
      },
      {
        "label": "96",
        "disabled": null
      },
      {
        "label": "104",
        "disabled": null
      },
      {
        "label": "112",
        "disabled": null
      },
      {
        "label": "120",
        "disabled": null
      },
      {
        "label": "128",
        "disabled": null
      },
      {
        "label": "136",
        "disabled": null
      },
      {
        "label": "144",
        "disabled": null
      },
      {
        "label": "152",
        "disabled": null
      },
      {
        "label": "160",
        "disabled": null
      },
      {
        "label": "168",
        "disabled": null
      },
      {
        "label": "176",
        "disabled": null
      },
      {
        "label": "184",
        "disabled": null
      },
      {
        "label": "192",
        "disabled": null
      },
      {
        "label": "200",
        "disabled": null
      },
      {
        "label": "208",
        "disabled": null
      },
      {
        "label": "216",
        "disabled": null
      },
      {
        "label": "224",
        "disabled": null
      },
      {
        "label": "232",
        "disabled": null
      },
      {
        "label": "240",
        "disabled": null
      },
      {
        "label": "248",
        "disabled": null
      },
      {
        "label": "256",
        "disabled": null
      },
      {
        "label": "264",
        "disabled": null
      },
      {
        "label": "272",
        "disabled": null
      },
      {
        "label": "280",
        "disabled": null
      },
      {
        "label": "288",
        "disabled": null
      },
      {
        "label": "296",
        "disabled": null
      },
      {
        "label": "304",
        "disabled": null
      },
      {
        "label": "312",
        "disabled": null
      },
      {
        "label": "320",
        "disabled": null
      },
      {
        "label": "328",
        "disabled": null
      },
      {
        "label": "336",
        "disabled": null
      },
      {
        "label": "344",
        "disabled": null
      },
      {
        "label": "352",
        "disabled": null
      },
      {
        "label": "360",
        "disabled": null
      },
      {
        "label": "368",
        "disabled": null
      },
      {
        "label": "376",
        "disabled": null
      },
      {
        "label": "384",
        "disabled": null
      },
      {
        "label": "392",
        "disabled": null
      },
      {
        "label": "400",
        "disabled": null
      },
      {
        "label": "408",
        "disabled": null
      },
      {
        "label": "416",
        "disabled": null
      },
      {
        "label": "424",
        "disabled": null
      },
      {
        "label": "432",
        "disabled": null
      },
      {
        "label": "440",
        "disabled": null
      },
      {
        "label": "448",
        "disabled": null
      },
      {
        "label": "456",
        "disabled": null
      },
      {
        "label": "464",
        "disabled": null
      },
      {
        "label": "472",
        "disabled": null
      },
      {
        "label": "480",
        "disabled": null
      },
      {
        "label": "488",
        "disabled": null
      },
      {
        "label": "496",
        "disabled": null
      },
      {
        "label": "504",
        "disabled": null
      },
      {
        "label": "512",
        "disabled": null
      },
      {
        "label": "544",
        "disabled": null
      },
      {
        "label": "576",
        "disabled": null
      },
      {
        "label": "608",
        "disabled": null
      },
      {
        "label": "640",
        "disabled": null
      },
      {
        "label": "672",
        "disabled": null
      },
      {
        "label": "704",
        "disabled": null
      },
      {
        "label": "736",
        "disabled": null
      },
      {
        "label": "768",
        "disabled": null
      },
      {
        "label": "800",
        "disabled": null
      },
      {
        "label": "832",
        "disabled": null
      },
      {
        "label": "864",
        "disabled": null
      },
      {
        "label": "928",
        "disabled": null
      },
      {
        "label": "960",
        "disabled": null
      },
      {
        "label": "992",
        "disabled": null
      },
      {
        "label": "1024",
        "disabled": null
      }
    ],
    "observedLocalOptions": null,
    "limitation": "Candidate-range FAIL is separate from prices of supported configurations. No unit-price root cause asserted; future owner must check current mappings, approved scope and data compatibility before implementing."
  },
  "renderedInputs": {
    "local": [
      {
        "domId": "drawer-profile",
        "index": 0,
        "tag": "SELECT",
        "type": "select-one",
        "label": "利用方式\nRedshift\nRedshift Serverless",
        "value": "serverless",
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
            "value": "provisioned",
            "label": "Redshift"
          },
          {
            "value": "serverless",
            "label": "Redshift Serverless"
          }
        ],
        "context": "利用方式\nRedshift\nRedshift Serverless"
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
        "domId": "input-component-serverless-compute-workloadSize",
        "index": 2,
        "tag": "SELECT",
        "type": "select-one",
        "label": "ワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large",
        "value": "Medium",
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
            "value": "Small",
            "label": "Small"
          },
          {
            "value": "Medium",
            "label": "Medium"
          },
          {
            "value": "Large",
            "label": "Large"
          },
          {
            "value": "Extra Large",
            "label": "Extra Large"
          }
        ],
        "context": "ワークロードのサイズ\nSmall\nMedium\nLarge\nExtra Large"
      },
      {
        "domId": "input-component-serverless-compute-baseRpu",
        "index": 3,
        "tag": "SELECT",
        "type": "select-one",
        "label": "ベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024",
        "value": "128",
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
          },
          {
            "value": "64",
            "label": "64"
          },
          {
            "value": "128",
            "label": "128"
          },
          {
            "value": "256",
            "label": "256"
          },
          {
            "value": "512",
            "label": "512"
          },
          {
            "value": "1024",
            "label": "1024"
          }
        ],
        "context": "ベース RPU\n4\n8\n16\n32\n64\n128\n256\n512\n1024"
      },
      {
        "domId": "input-component-serverless-compute-runtimeDailyHours",
        "index": 4,
        "tag": "INPUT",
        "type": "number",
        "label": "想定される1日あたりのランタイム (時間)",
        "value": "1",
        "visible": true,
        "disabled": false,
        "min": "0",
        "max": "24",
        "step": "any",
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "想定される1日あたりのランタイム (時間)"
      },
      {
        "domId": "input-component-backup-serverless-backupGb",
        "index": 5,
        "tag": "INPUT",
        "type": "number",
        "label": "追加のバックアップストレージ (GB)",
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
        "context": "追加のバックアップストレージ (GB)"
      },
      {
        "domId": "input-component-rms-serverless-managedGb",
        "index": 6,
        "tag": "INPUT",
        "type": "number",
        "label": "マネージドストレージサイズ (GB)",
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
        "context": "マネージドストレージサイズ (GB)"
      },
      {
        "domId": "input-profile--transferInGb",
        "index": 7,
        "tag": "INPUT",
        "type": "number",
        "label": "特定の宛先へのデータ転送 (IN) (GB)",
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
        "context": "特定の宛先へのデータ転送 (IN) (GB)"
      }
    ],
    "official": [
      {
        "domId": "formField17709-1791904686614-6306",
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
        "domId": "formField17711-1791904686615-676",
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
        "domId": "formField17724-1791904686616-9804",
        "index": 2,
        "tag": "BUTTON",
        "type": "button",
        "label": "Choose a Region",
        "value": "US West (Oregon)",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "US West (Oregon)",
        "section": ""
      },
      {
        "domId": "17736-1791904686620-9773",
        "index": 3,
        "tag": "INPUT",
        "type": "radio",
        "label": "Redshift",
        "value": false,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "awsui-tiles-17735-1791904686619-1160",
        "radioValue": "redshift",
        "toggle": null,
        "options": null,
        "context": "Redshift",
        "section": "Select Redshift instances "
      },
      {
        "domId": "17737-1791904686620-8675",
        "index": 4,
        "tag": "INPUT",
        "type": "radio",
        "label": "Redshift Serverless",
        "value": true,
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "awsui-tiles-17735-1791904686619-1160",
        "radioValue": "redshift_serverless",
        "toggle": null,
        "options": null,
        "context": "Redshift Serverless",
        "section": "Select Redshift instances "
      },
      {
        "domId": "formField17897-1791904686669-8057",
        "index": 5,
        "tag": "BUTTON",
        "type": "button",
        "label": "Workload size",
        "value": "Medium",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "Medium",
        "section": ""
      },
      {
        "domId": "formField17907-1791904686670-6067",
        "index": 6,
        "tag": "BUTTON",
        "type": "button",
        "label": "Base RPU",
        "value": "320",
        "visible": true,
        "disabled": false,
        "min": null,
        "max": null,
        "step": null,
        "name": "",
        "radioValue": null,
        "toggle": null,
        "options": null,
        "context": "320",
        "section": ""
      },
      {
        "domId": "formField17829-1791904686629-7694",
        "index": 7,
        "tag": "INPUT",
        "type": "text",
        "label": "Expected daily runtime (hours) Enter number of hours",
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
        "context": "Expected daily runtime (hours)",
        "section": ""
      },
      {
        "domId": "formField17839-1791904686630-273",
        "index": 8,
        "tag": "INPUT",
        "type": "number",
        "label": "Additional backup storage Value",
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
        "context": "Additional backup storage",
        "section": ""
      },
      {
        "domId": "formField17841-1791904686630-675",
        "index": 9,
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
        "context": "GB",
        "section": ""
      },
      {
        "domId": "formField17860-1791904686632-4231",
        "index": 10,
        "tag": "INPUT",
        "type": "number",
        "label": "Managed storage size Value",
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
        "context": "Value",
        "section": ""
      },
      {
        "domId": "formField17862-1791904686632-8454",
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
        "context": "GB",
        "section": ""
      },
      {
        "domId": "formField17880-1791904686633-6334",
        "index": 12,
        "tag": "INPUT",
        "type": "number",
        "label": "Data Transfer In To Value",
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
        "context": "Data Transfer In To",
        "section": ""
      },
      {
        "domId": "formField17882-1791904686633-8501",
        "index": 13,
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
        "context": "GB",
        "section": ""
      }
    ]
  },
  "severity": "HIGH"
}
```
