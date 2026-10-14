# elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: elastic-load-balancing。Profile: "standard"。Region: "ap-northeast-1"。
重大度: HIGH。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: https://nobleneet.github.io/AWSPricingCalculator_forTAE/。公式URL: https://calculator.aws/#/createCalculator/ElasticLoadBalancing。
実行ID: 20261013T120455-parity。計測/記録日時: 2026-10-14T02:12:46.558Z。公開build: 20261013T095030Z-78197541。
不具合観測: Valid GWLB/Endpoint inputs produce the explicit public GUI error: Price source missing for component gwlbe-hour/gwlbe-bytes: AmazonVPC. Public monthly total is unavailable, while the native GUI displays priced endpoint components and a monthly total. This is an observed product acceptance failure, not an external browser/access blocker. No missing local amounts, deltas, or price differences are inferred. Investigate source publication/loading/mapping before changing any prices.
入力判定: INCOMPLETE。料金判定: FAIL。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON](../../cases/elastic-load-balancing/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal.json)、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json.gz)、[公開棚卸し](../../local-field-inventory.json.gz)を確認せよ。
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
  "caseId": "elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal",
  "serviceId": "elastic-load-balancing",
  "profile": "standard",
  "region": "ap-northeast-1",
  "parameter": "input-profile--gwlbeCount",
  "officialFieldId": "elastic-load-balancing:Number of Gateway Load Balancer Endpoints",
  "localFieldId": "elastic-load-balancing:input-profile--gwlbeCount",
  "correspondenceRowId": "elastic-load-balancing:input-profile--gwlbeCount",
  "comparisonScope": "parent-service",
  "runnerSha256": "4ee081253849fd11c1cd8cb5a6d8b2b1793b538b1b32840d39739e27c4ee5138",
  "runnerSource": "runners/versions/4ee081253849fd11c1cd8cb5a6d8b2b1793b538b1b32840d39739e27c4ee5138.mjs",
  "pricingCaseMethod": "Independent new GUI Project and official BrowserContext for each case. Baseline values set through real controls; native numeric input application verified with up to 3 bounded attempts.",
  "inputVerdict": "INCOMPLETE",
  "pricingVerdict": "FAIL",
  "toleranceUsd": "0.01",
  "plannedInputs": {
    "baseline": [
      {
        "local": "input-profile--gwlbCount",
        "official": "Number of Availability Zones that Gateway Load Balancer is deployed to",
        "officialOccurrence": 0,
        "value": 1
      },
      {
        "local": "input-profile--gwlbNew",
        "official": "Average number of new connections/flows Value",
        "officialOccurrence": 0,
        "value": 600
      },
      {
        "local": "input-profile--gwlbSeconds",
        "official": "Average connection/flow duration Value",
        "officialOccurrence": 0,
        "value": 1
      },
      {
        "local": "input-profile--gwlbGbHour",
        "official": "Total processed bytes Value",
        "officialOccurrence": 0,
        "value": 1
      },
      {
        "local": "input-profile--gwlbeCount",
        "official": "Number of Gateway Load Balancer Endpoints",
        "officialOccurrence": 0,
        "value": 1
      }
    ],
    "change": {
      "local": "input-profile--gwlbeCount",
      "official": "Number of Gateway Load Balancer Endpoints",
      "before": "1",
      "after": 2
    },
    "baselineRole": "GUI configuration seed. Reproduce effectiveBaseline/localBefore/awsBefore, which include explicitly saved dependency preparation."
  },
  "inputConversions": {
    "field": "Number of Gateway Load Balancer Endpoints",
    "optionMap": null,
    "dependentSyncProcedure": "async()=>{await inputLocal('input-profile--gwlbeGbMonth',new Decimal(await local.locator('#input-profile--gwlbGbHour').inputValue()).times(730).toString());}",
    "setupProcedure": "async()=>{await inputLocal('input-profile--gwlbEnabled',true);await aws.getByRole('checkbox',{name:'Gateway Load Balancer',exact:true}).check();for(const family of ['alb','nlb','clb'])await inputLocal('input-profile--'+family+'Enabled',false);await aws.getByRole('checkbox',{name:'Application Load Balancer',exact:true}).uncheck();await inputLocal('input-profile--gwlbeGbMonth',730);}",
    "prepareProcedure": "async(f)=>{if(f[0].endsWith('gwlbeCount')){await inputLocal('input-profile--gwlbGbHour',0);await inputAws('Total processed bytes Value',0);await inputLocal('input-profile--gwlbeGbMonth',0);}}",
    "variant": "elb-gwlb",
    "dependentSync": "NLB processed GB/hour = new flows/second × bytes/flow × 3600 / 10^9. CLB GB/hour per CLB = aggregate local monthly GB / (730 × CLB count)."
  },
  "executionState": "FINISHED",
  "urls": {
    "local": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "aws": "https://calculator.aws/#/createCalculator/ElasticLoadBalancing"
  },
  "startedAt": "2026-10-14T02:12:14.128Z",
  "localBefore": {
    "observedAt": "2026-10-14T02:12:39.874Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "—",
    "monthlyUsd": null,
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": null,
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
        "label": "利用方式\nElastic Load Balancing",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
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
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--albEnabled",
        "label": "Application Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--nlbEnabled",
        "label": "Network Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbEnabled",
        "label": "Gateway Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--clbEnabled",
        "label": "Classic Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbCount",
        "label": "Gateway Load Balancer の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbNew",
        "label": "GWLB 毎秒の新しい接続/フロー",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbSeconds",
        "label": "GWLB 接続/フローの平均継続時間 (秒)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbGbHour",
        "label": "GWLB 1時間あたりの処理データ (GB)",
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
      },
      {
        "id": "input-profile--gwlbeCount",
        "label": "Gateway Load Balancer Endpoint の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbeGbMonth",
        "label": "Gateway Load Balancer Endpoint 月間処理データ (GB)",
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
    "warnings": "Price source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nElastic Load Balancing\n行名を編集\n\t\nElastic Load Balancing\nalbEnabled: false · albCount: 1 · nlbEnabled: false · nlbCount: 1 · gwlbEnabled: true · gwlbCount: 1 · clbEnabled: false · clbCount: 1 · albTarget: ec2 · albNewConnections: 0 · albConnectionSeconds: 0 · albGbHour: 0 · albRequests: 0 · albRules: 0 · nlbtcpNew: 0 · nlbtcpSeconds: 0 · nlbtcpBytes: 0 · nlbudpNew: 0 · nlbudpSeconds: 0 · nlbudpBytes: 0 · nlbtlsNew: 0 · nlbtlsSeconds: 0 · nlbtlsBytes: 0 · gwlbNew: 600 · gwlbSeconds: 1 · gwlbGbHour: 0 · gwlbeCount: 1 · gwlbeGbMonth: 0 · clbGbMonth: 0\n—\nPrice source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n計算済み小計\n$0.00\n未計算サービス: 1\n差額: 未計算項目があるため比較不可\nElastic Load Balancing\n×\n\nPrice source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.\n\n利用方式\nElastic Load Balancing\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nロードバランサーのタイプを選択\nApplication Load Balancer を見積もりに含める\nNetwork Load Balancer を見積もりに含める\nGateway Load Balancer を見積もりに含める\nClassic Load Balancer を見積もりに含める\nGateway Load Balancer\nGateway Load Balancer の数\nGWLB 毎秒の新しい接続/フロー\nGWLB 接続/フローの平均継続時間 (秒)\nGWLB 1時間あたりの処理データ (GB)\nGateway Load Balancer Endpoint の数\nGateway Load Balancer Endpoint 月間処理データ (GB)\nGateway Load Balancer 稼働時間\n$9.86\nGateway Load Balancer GLCU\n$2.92\nGateway Load Balancer Endpoint 稼働時間\n未計算\n\nPrice source missing for component gwlbe-hour: AmazonVPC.\n\nGateway Load Balancer Endpoint 処理データ\n未計算\n\nPrice source missing for component gwlbe-bytes: AmazonVPC.\n\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。\n\nデータ転送・関連ネットワーク料金は含みません。",
    "components": [
      {
        "id": "gwlb",
        "title": "Gateway Load Balancer",
        "monthly": "$9.86"
      }
    ],
    "screen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-prepared-before-1791943836081-local.png",
    "totalScreen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-prepared-before-1791943836081-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "—",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsBefore": {
    "observedAt": "2026-10-14T02:12:40.698Z",
    "url": "https://calculator.aws/#/createCalculator/ElasticLoadBalancing",
    "monthlyDisplay": "12.78",
    "monthlyUsd": "12.78",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "12.78",
      "12.78"
    ],
    "inputs": [
      {
        "id": "formField92-1791943936972-282",
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
        "id": "formField94-1791943936975-7576",
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
        "id": "formField107-1791943936980-3681",
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
        "id": "125-1791943936986-4456",
        "label": "Application Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "126-1791943936986-1486",
        "label": "Network Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "127-1791943936986-1765",
        "label": "Gateway Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "128-1791943936987-1924",
        "label": "Classic Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField417-1791943938217-9119",
        "label": "Number of Availability Zones that Gateway Load Balancer is deployed to",
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
        "id": "formField427-1791943938218-4569",
        "label": "Total processed bytes Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "0",
        "value": "0",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField429-1791943938218-1882",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB per hour",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField439-1791943938219-7199",
        "label": "Average number of new connections/flows Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField441-1791943938219-5849",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "per second",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField452-1791943938220-3521",
        "label": "Average connection/flow duration Value",
        "type": "number",
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
        "id": "formField454-1791943938220-110",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField464-1791943938221-1372",
        "label": "Number of Gateway Load Balancer Endpoints",
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
      }
    ],
    "warnings": [],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Elastic Load Balancing\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nElastic Load BalancingInfo\n\nSelect Elastic Load Balancing Function Options that you want to estimate\n\nApplication Load Balancer\nNetwork Load Balancer\nGateway Load Balancer\nClassic Load Balancer\nGateway Load Balancer feature\nService settings\nInfo\nThe calculations below are for one Gateway Load Balancer.\nNumber of Availability Zones that Gateway Load Balancer is deployed to\nShow calculations\n1 availability zones x 0.0135 USD x 730 hours in a month = 9.86 USD\nTotal hourly charges for all Gateway Load Balancers (monthly): 9.86 USD\nLoad Capacity Units (LCUs)\nInfo\n\nPlease specify at least one of the following dimensions to determine LCU pricing.\n\nTotal processed bytes\nEnter the total data processed.\nValue\nUnit\nGB per hour\nAverage number of new connections/flows\nUnit\nper second\nAverage connection/flow duration\nEnter the average duration for each new connection (if the duration is less than 1 second then enter 1 second).\nValue\nUnit\nseconds\nShow calculations\n600 new connections / 600 new connections per LCU = 1 new connections/flows LCUs\n600 new connections x 1 seconds = 600 active GWLB connections\n600 active connections / 60000 connections per LCU = 0.01 active GWLB connections LCUs\nMax (0 processed bytes LCUs , 1 new connections/flows LCUs , 0.01 active connections/flows LCUs) = 1 max GWLB LCUs\n1 GWLB LCUs x 0.004 GWLB LCU price x 730 hours per month = 2.92 USD (Gateway Load Balancer LCU usage)\nTotal LCU charges for all Gateway Load Balancers (monthly): 2.92 USD\nGateway Load Balancer Endpoint\nInfo\nNumber of Gateway Load Balancer Endpoints\nShow calculations\n1 load balancer endpoints x 0.014 USD per hour x 730 hours in a month = 10.22 USD for hourly usage\nTotal hourly charges for all Gateway Load Balancer Endpoints (monthly): 10.22 USD\nTotal data transfer charges for all Gateway Load Balancer Endpoints (monthly): 0 USD\nTotal charges for all Gateway Load Balancer Endpoints (monthly): 0.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 12.78 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-prepared-before-1791943836081-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "localAfter": {
    "observedAt": "2026-10-14T02:12:45.539Z",
    "url": "https://nobleneet.github.io/AWSPricingCalculator_forTAE/",
    "monthlyDisplay": "—",
    "monthlyUsd": null,
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": null,
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
        "label": "利用方式\nElastic Load Balancing",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
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
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--albEnabled",
        "label": "Application Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--nlbEnabled",
        "label": "Network Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbEnabled",
        "label": "Gateway Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--clbEnabled",
        "label": "Classic Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbCount",
        "label": "Gateway Load Balancer の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbNew",
        "label": "GWLB 毎秒の新しい接続/フロー",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbSeconds",
        "label": "GWLB 接続/フローの平均継続時間 (秒)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbGbHour",
        "label": "GWLB 1時間あたりの処理データ (GB)",
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
      },
      {
        "id": "input-profile--gwlbeCount",
        "label": "Gateway Load Balancer Endpoint の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "2",
        "value": "2",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbeGbMonth",
        "label": "Gateway Load Balancer Endpoint 月間処理データ (GB)",
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
    "warnings": "Price source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.",
    "text": "AWS ARCHITECTURE ESTIMATOR\nAWS構成・料金比較\n\n構成案を複製して、違いと月額をひとつの画面で比較。\n\n新規Project\nJSONを復元\nProject JSON\nCSV\nPDF + JSON\nProject名\nRegion\nTokyo · ap-northeast-1\nOsaka · ap-northeast-3\nN. Virginia · us-east-1\nOhio · us-east-2\nN. California · us-west-1\nOregon · us-west-2\n共通 月間時間\nSchedulerの残り無料枠 (回/月)\nUSD · On-Demand · 税別 · Schedulerのみ明示した無料枠を適用 · その他の無料枠・割引なし\nPrice Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541\n更新確認\n1 構成案 · 1 比較行\n空のPlanを追加\n比較項目\t\n案 1\nBaseline\n名称・メモ\nPlanを複製\nサービスを追加\nElastic Load Balancing\n行名を編集\n\t\nElastic Load Balancing\nalbEnabled: false · albCount: 1 · nlbEnabled: false · nlbCount: 1 · gwlbEnabled: true · gwlbCount: 1 · clbEnabled: false · clbCount: 1 · albTarget: ec2 · albNewConnections: 0 · albConnectionSeconds: 0 · albGbHour: 0 · albRequests: 0 · albRules: 0 · nlbtcpNew: 0 · nlbtcpSeconds: 0 · nlbtcpBytes: 0 · nlbudpNew: 0 · nlbudpSeconds: 0 · nlbudpBytes: 0 · nlbtlsNew: 0 · nlbtlsSeconds: 0 · nlbtlsBytes: 0 · gwlbNew: 600 · gwlbSeconds: 1 · gwlbGbHour: 0 · gwlbeCount: 2 · gwlbeGbMonth: 0 · clbGbMonth: 0\n—\nPrice source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.\n編集\n別サービスへ置換\nPlanから外す\n\n月額 / 差額\t\n計算済み小計\n$0.00\n未計算サービス: 1\n差額: 未計算項目があるため比較不可\nElastic Load Balancing\n×\n\nPrice source missing for component gwlbe-hour: AmazonVPC. / Price source missing for component gwlbe-bytes: AmazonVPC.\n\n利用方式\nElastic Load Balancing\nリージョン\nプロジェクトのリージョンを継承\nアジアパシフィック (東京) に変更\nロードバランサーのタイプを選択\nApplication Load Balancer を見積もりに含める\nNetwork Load Balancer を見積もりに含める\nGateway Load Balancer を見積もりに含める\nClassic Load Balancer を見積もりに含める\nGateway Load Balancer\nGateway Load Balancer の数\nGWLB 毎秒の新しい接続/フロー\nGWLB 接続/フローの平均継続時間 (秒)\nGWLB 1時間あたりの処理データ (GB)\nGateway Load Balancer Endpoint の数\nGateway Load Balancer Endpoint 月間処理データ (GB)\nGateway Load Balancer 稼働時間\n$9.86\nGateway Load Balancer GLCU\n$2.92\nGateway Load Balancer Endpoint 稼働時間\n未計算\n\nPrice source missing for component gwlbe-hour: AmazonVPC.\n\nGateway Load Balancer Endpoint 処理データ\n未計算\n\nPrice source missing for component gwlbe-bytes: AmazonVPC.\n\n料金見積もりの制約\n\nUSD On-Demand、税別。RI・Savings Plans・Spot・個別割引は対象外です。\n\nデータ転送・関連ネットワーク料金は含みません。",
    "components": [
      {
        "id": "gwlb",
        "title": "Gateway Load Balancer",
        "monthly": "$9.86"
      }
    ],
    "screen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-synced-after-1791943836081-local.png",
    "totalScreen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-synced-after-1791943836081-visible-total-local.png",
    "totalDisplayWithDrawerClosed": "—",
    "priceMeta": "Price Data 2026-10-12T23:11:02Z · 20261013T095030Z-78197541"
  },
  "awsAfter": {
    "observedAt": "2026-10-14T02:12:46.558Z",
    "url": "https://calculator.aws/#/createCalculator/ElasticLoadBalancing",
    "monthlyDisplay": "12.78",
    "monthlyUsd": "12.78",
    "monthlyUsdIsUpperBound": false,
    "monthlyUsdInterval": [
      "12.78",
      "12.78"
    ],
    "inputs": [
      {
        "id": "formField92-1791943936972-282",
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
        "id": "formField94-1791943936975-7576",
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
        "id": "formField107-1791943936980-3681",
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
        "id": "125-1791943936986-4456",
        "label": "Application Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "126-1791943936986-1486",
        "label": "Network Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "127-1791943936986-1765",
        "label": "Gateway Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "128-1791943936987-1924",
        "label": "Classic Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField417-1791943938217-9119",
        "label": "Number of Availability Zones that Gateway Load Balancer is deployed to",
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
        "id": "formField427-1791943938218-4569",
        "label": "Total processed bytes Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "0",
        "value": "0",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField429-1791943938218-1882",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB per hour",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField439-1791943938219-7199",
        "label": "Average number of new connections/flows Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField441-1791943938219-5849",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "per second",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField452-1791943938220-3521",
        "label": "Average connection/flow duration Value",
        "type": "number",
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
        "id": "formField454-1791943938220-110",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField464-1791943938221-1372",
        "label": "Number of Gateway Load Balancer Endpoints",
        "type": "text",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "2",
        "value": "2",
        "visible": true,
        "invalid": null
      }
    ],
    "warnings": [],
    "text": "Feedback\nLanguage: English\nContact Sales \nCreate an AWS Account\nCreate estimate: Configure Elastic Load Balancing\n \nInfo\nDescription\nChoose a location typeInfo\nRegion\nChoose a Region\nAsia Pacific (Tokyo)\nElastic Load BalancingInfo\n\nSelect Elastic Load Balancing Function Options that you want to estimate\n\nApplication Load Balancer\nNetwork Load Balancer\nGateway Load Balancer\nClassic Load Balancer\nGateway Load Balancer feature\nService settings\nInfo\nThe calculations below are for one Gateway Load Balancer.\nNumber of Availability Zones that Gateway Load Balancer is deployed to\nShow calculations\n1 availability zones x 0.0135 USD x 730 hours in a month = 9.86 USD\nTotal hourly charges for all Gateway Load Balancers (monthly): 9.86 USD\nLoad Capacity Units (LCUs)\nInfo\n\nPlease specify at least one of the following dimensions to determine LCU pricing.\n\nTotal processed bytes\nEnter the total data processed.\nValue\nUnit\nGB per hour\nAverage number of new connections/flows\nUnit\nper second\nAverage connection/flow duration\nEnter the average duration for each new connection (if the duration is less than 1 second then enter 1 second).\nValue\nUnit\nseconds\nShow calculations\n600 new connections / 600 new connections per LCU = 1 new connections/flows LCUs\n600 new connections x 1 seconds = 600 active GWLB connections\n600 active connections / 60000 connections per LCU = 0.01 active GWLB connections LCUs\nMax (0 processed bytes LCUs , 1 new connections/flows LCUs , 0.01 active connections/flows LCUs) = 1 max GWLB LCUs\n1 GWLB LCUs x 0.004 GWLB LCU price x 730 hours per month = 2.92 USD (Gateway Load Balancer LCU usage)\nTotal LCU charges for all Gateway Load Balancers (monthly): 2.92 USD\nGateway Load Balancer Endpoint\nInfo\nNumber of Gateway Load Balancer Endpoints\nShow calculations\n2 load balancer endpoints x 0.014 USD per hour x 730 hours in a month = 20.44 USD for hourly usage\nTotal hourly charges for all Gateway Load Balancer Endpoints (monthly): 20.44 USD\nTotal data transfer charges for all Gateway Load Balancer Endpoints (monthly): 0 USD\nTotal charges for all Gateway Load Balancer Endpoints (monthly): 0.00 USD\nAcknowledgement\nAWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services.Learn more \n\n\n\nTotal Upfront cost: 0.00 USD\nTotal Monthly cost: 12.78 USD\nShow Details\nCancel\nSave and view summary\nSave and add service\nPrivacy\nSite terms\nCookie preferences\n© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.",
    "components": null,
    "screen": "screenshots/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal-after-1791943836081-aws.png",
    "totalScreen": null,
    "totalDisplayWithDrawerClosed": null,
    "priceMeta": null
  },
  "publicBuildId": "20261013T095030Z-78197541",
  "reason": "Valid GWLB/Endpoint inputs produce the explicit public GUI error: Price source missing for component gwlbe-hour/gwlbe-bytes: AmazonVPC. Public monthly total is unavailable, while the native GUI displays priced endpoint components and a monthly total. This is an observed product acceptance failure, not an external browser/access blocker. No missing local amounts, deltas, or price differences are inferred. Investigate source publication/loading/mapping before changing any prices.",
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
        "label": "利用方式\nElastic Load Balancing",
        "type": "select-one",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "standard",
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
        "value": "inherit",
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--albEnabled",
        "label": "Application Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--nlbEnabled",
        "label": "Network Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbEnabled",
        "label": "Gateway Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--clbEnabled",
        "label": "Classic Load Balancer を見積もりに含める",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "input-profile--gwlbCount",
        "label": "Gateway Load Balancer の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbNew",
        "label": "GWLB 毎秒の新しい接続/フロー",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbSeconds",
        "label": "GWLB 接続/フローの平均継続時間 (秒)",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbGbHour",
        "label": "GWLB 1時間あたりの処理データ (GB)",
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
      },
      {
        "id": "input-profile--gwlbeCount",
        "label": "Gateway Load Balancer Endpoint の数",
        "type": "number",
        "min": "0",
        "max": null,
        "step": "any",
        "disabled": false,
        "role": null,
        "controlValue": "1",
        "value": "1",
        "visible": true,
        "invalid": "false"
      },
      {
        "id": "input-profile--gwlbeGbMonth",
        "label": "Gateway Load Balancer Endpoint 月間処理データ (GB)",
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
    "aws": [
      {
        "id": "formField92-1791943936972-282",
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
        "id": "formField94-1791943936975-7576",
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
        "id": "formField107-1791943936980-3681",
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
        "id": "125-1791943936986-4456",
        "label": "Application Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "126-1791943936986-1486",
        "label": "Network Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "127-1791943936986-1765",
        "label": "Gateway Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": true,
        "visible": true,
        "invalid": null
      },
      {
        "id": "128-1791943936987-1924",
        "label": "Classic Load Balancer",
        "type": "checkbox",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "on",
        "value": false,
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField417-1791943938217-9119",
        "label": "Number of Availability Zones that Gateway Load Balancer is deployed to",
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
        "id": "formField427-1791943938218-4569",
        "label": "Total processed bytes Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "0",
        "value": "0",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField429-1791943938218-1882",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "GB per hour",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField439-1791943938219-7199",
        "label": "Average number of new connections/flows Value",
        "type": "number",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "600",
        "value": "600",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField441-1791943938219-5849",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "per second",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField452-1791943938220-3521",
        "label": "Average connection/flow duration Value",
        "type": "number",
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
        "id": "formField454-1791943938220-110",
        "label": "Unit",
        "type": "button",
        "min": null,
        "max": null,
        "step": null,
        "disabled": false,
        "role": null,
        "controlValue": "",
        "value": "seconds",
        "visible": true,
        "invalid": null
      },
      {
        "id": "formField464-1791943938221-1372",
        "label": "Number of Gateway Load Balancer Endpoints",
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
      }
    ]
  },
  "measurementVerdict": "BLOCKED",
  "guiInputApplicationChecks": [
    {
      "label": "Number of Availability Zones that Gateway Load Balancer is deployed to",
      "desired": "1",
      "rendered": "1",
      "alreadyMatched": true,
      "exact": true
    },
    {
      "label": "Average number of new connections/flows Value",
      "desired": "600",
      "rendered": "600",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Average connection/flow duration Value",
      "desired": "1",
      "rendered": "1",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Total processed bytes Value",
      "desired": "1",
      "rendered": "1",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Number of Gateway Load Balancer Endpoints",
      "desired": "1",
      "rendered": "1",
      "alreadyMatched": true,
      "exact": true
    },
    {
      "label": "Total processed bytes Value",
      "desired": "0",
      "rendered": "0",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    },
    {
      "label": "Number of Gateway Load Balancer Endpoints",
      "desired": "2",
      "rendered": "2",
      "exact": true,
      "renderedMinusDesired": "0",
      "quantityPrecisionTolerance": "1e-9 only for long decimal conversion values; USD tolerance remains 0.01",
      "verified": true
    }
  ],
  "finishedAt": "2026-10-14T02:12:46.558Z",
  "previousAttemptEvidence": "attempts/elastic-load-balancing-standard-ap-northeast-1-input-profile--gwlbeCount-delta-elb-gwlb-signal/20261014T020745079.json",
  "previousAttempts": [
    {
      "startedAt": "2026-10-14T02:07:45.079Z",
      "reason": "One or more rendered GUI inputs marked aria-invalid=true. Amounts retained as raw evidence; no valid equal-input pricing verdict claimed."
    }
  ],
  "componentComparisons": [
    {
      "when": "Before",
      "localComponentIds": [
        "gwlb"
      ],
      "localDisplayedCosts": [
        "$9.86"
      ],
      "localDisplayIntervalUsd": [
        "9.86",
        "9.86"
      ],
      "officialDisplayedLine": "Total hourly charges for all Gateway Load Balancers (monthly): 9.86 USD",
      "officialDisplayUsd": "9.86",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "gwlb-lcu"
      ],
      "localDisplayedCosts": [
        "$2.92"
      ],
      "localDisplayIntervalUsd": [
        "2.92",
        "2.92"
      ],
      "officialDisplayedLine": "Total LCU charges for all Gateway Load Balancers (monthly): 2.92 USD",
      "officialDisplayUsd": "2.92",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "gwlbe-hour"
      ],
      "verdict": "INCOMPLETE",
      "localDisplayIntervalUsd": null,
      "officialDisplayedLine": "Total hourly charges for all Gateway Load Balancer Endpoints (monthly): 10.22 USD",
      "reason": "Public GUI explicitly reports unavailable price source for these components; null local cost is not zero."
    },
    {
      "when": "Before",
      "localComponentIds": [
        "gwlbe-bytes"
      ],
      "verdict": "INCOMPLETE",
      "localDisplayIntervalUsd": null,
      "officialDisplayedLine": "Total data transfer charges for all Gateway Load Balancer Endpoints (monthly): 0 USD",
      "reason": "Public GUI explicitly reports unavailable price source for these components; null local cost is not zero."
    },
    {
      "when": "After",
      "localComponentIds": [
        "gwlb"
      ],
      "localDisplayedCosts": [
        "$9.86"
      ],
      "localDisplayIntervalUsd": [
        "9.86",
        "9.86"
      ],
      "officialDisplayedLine": "Total hourly charges for all Gateway Load Balancers (monthly): 9.86 USD",
      "officialDisplayUsd": "9.86",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "gwlb-lcu"
      ],
      "localDisplayedCosts": [
        "$2.92"
      ],
      "localDisplayIntervalUsd": [
        "2.92",
        "2.92"
      ],
      "officialDisplayedLine": "Total LCU charges for all Gateway Load Balancers (monthly): 2.92 USD",
      "officialDisplayUsd": "2.92",
      "distanceUsd": "0.00",
      "verdict": "PASS",
      "precision": "Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained."
    },
    {
      "when": "After",
      "localComponentIds": [
        "gwlbe-hour"
      ],
      "verdict": "INCOMPLETE",
      "localDisplayIntervalUsd": null,
      "officialDisplayedLine": "Total hourly charges for all Gateway Load Balancer Endpoints (monthly): 20.44 USD",
      "reason": "Public GUI explicitly reports unavailable price source for these components; null local cost is not zero."
    },
    {
      "when": "After",
      "localComponentIds": [
        "gwlbe-bytes"
      ],
      "verdict": "INCOMPLETE",
      "localDisplayIntervalUsd": null,
      "officialDisplayedLine": "Total data transfer charges for all Gateway Load Balancer Endpoints (monthly): 0 USD",
      "reason": "Public GUI explicitly reports unavailable price source for these components; null local cost is not zero."
    }
  ],
  "componentComparisonComplete": false,
  "totalComparisonVerdict": "BLOCKED",
  "equalityKind": "UNMEASURED_TOTAL",
  "directionComparison": {
    "local": null,
    "aws": "unchanged",
    "reason": "Directions only derived for sides with both measured monthly totals; unavailable local delta remains null."
  },
  "observedInputChanges": {
    "local": [
      {
        "key": "input-profile--gwlbeCount|0",
        "label": "Gateway Load Balancer Endpoint の数",
        "id": "input-profile--gwlbeCount",
        "before": "1",
        "after": "2",
        "added": false
      }
    ],
    "aws": [
      {
        "key": "Number of Gateway Load Balancer Endpoints|text|0",
        "label": "Number of Gateway Load Balancer Endpoints",
        "id": "formField464-1791943938221-1372",
        "before": "1",
        "after": "2",
        "added": false
      }
    ]
  },
  "awsDeltaUsd": "0.00",
  "selectedInstanceConsistency": {
    "before": [],
    "after": [],
    "targetChangesInstanceType": false,
    "unchanged": true
  },
  "rawUnavailableMonthlyVerdict": "BLOCKED",
  "severity": "HIGH",
  "failureKind": "PUBLIC_RUNTIME_PRICE_SOURCE_UNAVAILABLE",
  "unmeasuredAmountReason": "Public monthly total displayed as an em dash and endpoint components as uncalculated because of the recorded missing-price-source runtime error.",
  "localDeltaUsd": null,
  "beforeDifferenceUsd": null,
  "afterDifferenceUsd": null,
  "deltaDifferenceUsd": null,
  "pagesCommitSha": "b51df2118aee65f2631db653e3bd01df56da091a",
  "officialFieldIds": [
    "elastic-load-balancing:aws:Number-of-Gateway-Load-Balancer-Endpoints-text-0-34f115c5bf"
  ],
  "localFieldIds": [
    "elastic-load-balancing:input-profile--gwlbeCount"
  ],
  "inputMetadataLimitation": "GUI input and unit equivalence assessed for measured cases only. Full defaults, candidates, ranges and conditional-parent combinations are not yet exhausted; case-level pricing PASS does not certify full input metadata.",
  "warningsAndLimitations": [
    "Input metadata and complete service parity not certified by a pricing PASS."
  ]
}
```
