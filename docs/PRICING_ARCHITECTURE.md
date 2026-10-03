# Pricing Architecture Specification

最終更新: 2026-10-03

## 1. 目的

本書は、AWSPricingCalculator_forTAE における AWS Public Price List の取得、正規化、配信、検索、料金計算、サービス定義、CI 検証、GitHub Actions 更新運用の詳細仕様を定義する。

UI、Project、構成案、保存・復元、PDF/CSV 出力等の全体仕様は `docs/SPEC.md` を正本とし、本書は料金基盤およびサービス拡張基盤の詳細仕様を扱う。

設計上の主要目標は以下とする。

- AWS Public Price List JSON を料金計算の正本とする。
- GitHub Pages 上でバックエンドサーバーなしに動作できる構成とする。
- AWS 公式 Price List の巨大 JSON をユーザーのブラウザへ直接配信しない。
- GitHub Actions で AWS 公式データを取得・加工し、ブラウザ向けの軽量 Price DB を生成する。
- 料金の変化に関わり得る AWS 属性を不用意に削除しない。
- 未収録 AWS サービスを、既存の共通 JavaScript を極力変更せず追加できるデータ駆動構造とする。
- AWS 側の料金体系変更や未知属性追加による静かな誤計算を CI で検知する。

---

## 2. ホスティング構成

### 2.1 基本構成

本アプリの本番ホスティングは、当面以下を基本構成とする。

- Frontend: GitHub Pages
- Backend application server: なし
- Database server: なし
- Price source: AWS Public Price List JSON
- Price update / build: GitHub Actions
- Project state persistence: browser `localStorage`
- Formal project export/import: Project JSON
- PDF / CSV generation: browser side

概念構成:

```text
AWS Public Price List
        |
        v
GitHub Actions
  - metadata/version check
  - source JSON download
  - normalization
  - validation
  - Price DB generation
        |
        v
pricing/generated/
        |
        v
GitHub Pages
        |
        v
Browser
  - required Price DB only
  - pricing calculation
  - localStorage
  - PDF / CSV / Project JSON
```

### 2.2 AWS 元 JSON の扱い

AWS 公式の 20MB〜数十MB級 Price List JSON は、GitHub Actions runner 上で一時的に取得して利用する。

元 JSON 自体はリポジトリへ保存しない。

永続化するのは、正規化・検証後の `pricing/generated/` 配下のデータのみとする。

---

## 3. 基本設計原則

### 3.1 Price Data と UI Definition を分離する

以下を明確に分離する。

```text
Price Data
= AWS がどの条件でいくら課金するか

Service Definition
= ユーザーに何を選択・入力させるか

Pricing Engine
= 使用量と Price Dimension から金額をどう算出するか

UI Renderer
= Service Definition から入力 UI をどう生成するか
```

価格そのものを `service.json` 等の Definition に書かない。

### 3.2 AWS 属性は原則保持する

採用対象 SKU の `attributes` は allowlist 方式で削らず、原則そのまま保持する。

現時点で UI に使っていない属性であっても、将来価格差に関与する可能性があるためである。

ただし、本アプリの対象外と確定している料金体系は生成対象から除外できる。

当面の対象外:

- Reserved Instances
- Savings Plans
- Spot
- 税
- 為替換算
- アカウント依存の Free Tier

### 3.3 任意 JavaScript 式を Definition に書かない

Definition 内で任意式を評価する設計は禁止する。

例:

```json
{
  "formula": "requests * price / 1000000"
}
```

のような方式は採用しない。

代わりに、限定された宣言的 Pricing Model、scale、transform、reference を使用する。

宣言形式で表現できない例外のみ `adapter.js` を許可する。

---

## 4. データモデル階層

料金定義の論理階層は以下とする。

```text
Service
  -> Profile
      -> Pricing Component
          -> AWS Product / Term / Price Dimension
```

### 4.1 Service

ユーザーが認識する AWS サービス単位。

例:

- EC2
- RDS
- Aurora
- S3
- Lambda

Service の境界は AWS Public Price List の `serviceCode` と必ずしも 1:1 ではない。

Price Source の境界は AWS Public Price List の `serviceCode` に従うが、アプリ上の Service は AWS Price List 内の自然な商品区分、`productFamily`、属性、`usagetype`、`operation` 等を根拠として分割できる。

例:

```text
Price Source: AmazonRDS
  - App Service: RDS
  - App Service: Aurora
  - App Service: Aurora Serverless
```

### 4.2 Profile

同じ Service の中の利用方式・料金方式を表す。

例:

```text
Aurora
  - Provisioned
  - Serverless v2
```

### 4.3 Pricing Component

ユーザーが個別に調整可能な課金要素を表す。

例:

```text
Aurora Provisioned
  - Instance
  - Storage
  - I/O
  - Backup
```

料金要素を月額合計へ早期に潰さず、個別 Component として保持する。

---

## 5. Service Definition ファイル構成

標準構成:

```text
services/
  aurora/
    service.json
    profiles/
      provisioned.json
      serverless-v2.json
    components/
      instance.json
      acu.json
      storage.json
      io.json
      backup.json
    adapter.js              # 必要な場合のみ
```

### 5.1 service.json

Service 自体の識別情報、Price Source、利用可能 Profile を持つ。

例:

```json
{
  "schemaVersion": 1,
  "id": "aurora",
  "label": "Amazon Aurora",
  "description": "Managed relational database compatible with MySQL and PostgreSQL.",
  "priceSource": {
    "serviceCode": "AmazonRDS"
  },
  "profiles": [
    "provisioned",
    "serverless-v2"
  ],
  "defaultProfile": "provisioned"
}
```

必須:

- `schemaVersion`
- `id`
- `label`
- `priceSource.serviceCode`
- `profiles`

任意:

- `description`
- `defaultProfile`
- `documentationUrl`
- `tags`

価格値そのものは持たない。

### 5.2 profile.json

複数 Component に共通する selector、filter、Component 一覧を持つ。

例:

```json
{
  "schemaVersion": 1,
  "id": "provisioned",
  "label": "Provisioned",
  "selectors": [
    {
      "id": "engine",
      "label": "Database engine",
      "type": "select",
      "options": {
        "source": "priceData",
        "attribute": "databaseEngine"
      }
    }
  ],
  "fixedFilters": [],
  "components": [
    "instance",
    "storage",
    "io",
    "backup"
  ]
}
```

### 5.3 component.json

個別の料金要素について以下を持つ。

- selectors
- usageInputs
- fixedFilters
- priceQuery
- calculation
- enabledWhen

例:

```json
{
  "schemaVersion": 1,
  "id": "instance",
  "label": "DB instance",
  "selectors": [
    {
      "id": "instanceType",
      "label": "Instance class",
      "type": "select",
      "options": {
        "source": "priceData",
        "attribute": "instanceType",
        "filters": [
          {
            "field": "attributes.databaseEngine",
            "op": "eq",
            "valueFrom": "profile.engine"
          }
        ]
      }
    }
  ],
  "usageInputs": [
    {
      "id": "quantity",
      "label": "Instances",
      "type": "integer",
      "default": 1,
      "minimum": 1
    },
    {
      "id": "hoursPerMonth",
      "label": "Hours / month",
      "type": "number",
      "default": 730,
      "minimum": 0
    }
  ],
  "priceQuery": {
    "filters": [
      {
        "field": "productFamily",
        "op": "eq",
        "value": "Database Instance"
      },
      {
        "field": "attributes.databaseEngine",
        "op": "eq",
        "valueFrom": "profile.engine"
      },
      {
        "field": "attributes.instanceType",
        "op": "eq",
        "valueFrom": "component.instanceType"
      },
      {
        "field": "dimensions.unit",
        "op": "eq",
        "value": "Hrs"
      }
    ],
    "expect": "singleSku"
  },
  "calculation": {
    "model": "unit",
    "usage": [
      { "valueFrom": "component.hoursPerMonth" },
      { "valueFrom": "component.quantity" }
    ]
  }
}
```

---

## 6. 入力値と UI 定義

### 6.1 入力値の分類

入力・条件は以下の3種類へ分ける。

#### selector

SKU や Price Dimension の選択条件を変えるユーザー選択値。

例:

- Instance type
- OS
- Database engine
- Storage class
- Deployment option

#### usageInput

同じ単価へ掛ける利用量。

例:

- Instance count
- Hours/month
- Storage GB
- Requests/month
- Data transfer GB

#### fixedFilter

SKU 特定には必要だが通常ユーザーへ変更させない条件。

例:

- tenancy = Shared
- preInstalledSw = NA
- purchase option = On-Demand

### 6.2 UI input type

初期版で認める型:

- `select`
- `number`
- `integer`
- `boolean`
- `text`

### 6.3 selector option source

選択肢の source は以下の2種類とする。

#### priceData

Price DB の属性値から自動生成する。

```json
{
  "source": "priceData",
  "attribute": "instanceType"
}
```

#### static

Price DB から直接導出できない UI 選択肢に使用する。

```json
{
  "source": "static",
  "values": [
    { "value": "always", "label": "Always" },
    { "value": "never", "label": "Never" }
  ]
}
```

可能な限り `priceData` を優先する。

AWS 側に新 instance type 等が追加された場合、Price DB 更新だけで UI の選択肢へ自動反映できる構造を目指す。

---

## 7. 値参照 DSL

値は原則として以下のどちらかで指定する。

- `value`
- `valueFrom`

同時指定は禁止する。

`valueFrom` で利用可能な scope:

- `project.*`
- `service.*`
- `profile.*`
- `component.*`

例:

```json
{
  "field": "attributes.databaseEngine",
  "op": "eq",
  "valueFrom": "profile.engine"
}
```

```json
{
  "field": "attributes.tenancy",
  "op": "eq",
  "value": "Shared"
}
```

---

## 8. Price Query

Price Query は特定の AWS 属性を schema 上の専用フィールドとして増やさず、汎用 `filters[]` へ統一する。

例:

```json
{
  "filters": [
    {
      "field": "productFamily",
      "op": "eq",
      "value": "Database Instance"
    },
    {
      "field": "attributes.databaseEngine",
      "op": "eq",
      "valueFrom": "profile.engine"
    },
    {
      "field": "dimensions.unit",
      "op": "eq",
      "value": "Hrs"
    }
  ],
  "expect": "singleSku"
}
```

初期版 operator:

- `eq`
- `neq`
- `in`
- `notIn`
- `exists`

### 8.1 expect

SKU 解決結果の期待値を宣言する。

初期値:

- `singleSku`
- `multipleSkus`

原則 `singleSku` とし、複数 SKU が正常な場合のみ `multipleSkus` を明示する。

---

## 9. Pricing Engine

### 9.1 基本モデル

Pricing Engine の基本 Pricing Model は以下の2種類とする。

- `unit`
- `tiered`

request、hourly、storage、throughput 等をサービス固有モデルとして増やさない。

### 9.2 unit

基本式:

```text
price = pricePerUnit * product(usage values)
```

例:

```text
EC2 = hourly price * hours * quantity
Aurora Serverless = ACU-hour price * ACU-hours
EBS = GB-month price * GB
```

### 9.3 tiered

AWS Price Dimension の `beginRange` / `endRange` を直接利用して段階料金を算出する。

Definition 側へ tier の単価や範囲を転記しない。

### 9.4 Price Dimension

Price Dimension を料金計算の最小単位として扱う。

同一 SKU / OnDemand Term に複数 Price Dimension が存在する場合、必要な Dimension を評価し合算する。

### 9.5 Component / Service / Plan 合算

`compound` という独立 Pricing Model は設けない。

```text
Service total = sum(Component total)
Plan total    = sum(Service total)
```

とする。

### 9.6 scale

1000 requests、1 million requests 等の正規化に使用する。

例:

```json
{
  "scale": {
    "divideBy": 1000000
  }
}
```

### 9.7 transform

使用量の minimum / rounding / step を宣言的に表現できるようにする。

初期対応:

- `minimum`
- `maximum`
- `round`: `ceil` / `floor` / `nearest`
- `step`

### 9.8 Unit Conversion

Pricing Engine は限定された汎用単位変換を持つ。

対象例:

- GB / TB
- MB / GB
- seconds / hours
- requests / thousand requests / million requests

単価を手動補正するのではなく、usage を Price Dimension の unit へ正規化する。

### 9.9 Free Tier

アカウント状態や他ワークロード消費量に依存する Free Tier は計算対象外とする。

一方、AWS Price List 自体の Price Dimension として存在するゼロ価格 tier は通常どおり計算する。

### 9.10 adapter

`unit` / `tiered` と宣言 DSL で表現できない場合のみ `adapter.js` を許可する。

adapter は例外扱いとし、増殖を避ける。

---

## 10. Component の有効条件

オプション課金要素は `enabledWhen` で有効・無効を宣言できる。

例:

```json
{
  "enabledWhen": [
    {
      "valueFrom": "component.enableBackup",
      "op": "eq",
      "value": true
    }
  ]
}
```

これにより、Provisioned IOPS、追加 Backup、Monitoring 等を Component 単位で切り替えられるようにする。

---

## 11. Price DB

### 11.1 ディレクトリ構成

```text
pricing/generated/
  manifest.json
  sources/
    AmazonRDS/
      ap-northeast-1/
        products.json
  indexes/
    AmazonRDS/
      ap-northeast-1/
        index.json
```

Price Source の単位は AWS `serviceCode` × Region とする。

### 11.2 manifest.json

Price DB 全体の入口となる小さいメタデータファイル。

含む情報:

- schemaVersion
- generatedAt
- serviceCode
- supported regions
- AWS publicationDate / version
- products path
- index path

ブラウザはまず manifest を読み、必要な Price Source を解決する。

### 11.3 products.json

AWS Product、OnDemand Term、Price Dimension を Actions 側で SKU 単位に join / normalize して保存する。

原則として意味のある情報を落とさない。

例:

```json
{
  "sku": "ABC123",
  "productFamily": "Database Instance",
  "attributes": {
    "databaseEngine": "Aurora MySQL",
    "instanceType": "db.r7g.large",
    "regionCode": "ap-northeast-1"
  },
  "terms": [
    {
      "offerTermCode": "...",
      "effectiveDate": "...",
      "dimensions": [
        {
          "rateCode": "...",
          "description": "...",
          "beginRange": "0",
          "endRange": "Inf",
          "unit": "Hrs",
          "pricePerUnit": {
            "USD": "0.1234000000"
          },
          "appliesTo": []
        }
      ]
    }
  ]
}
```

### 11.4 原値の型

AWS 原文との比較、精度保持、diff 容易性のため、以下は原則文字列のまま保持する。

- `pricePerUnit`
- `beginRange`
- `endRange`

Pricing Engine 側で安全な数値処理へ変換する。

### 11.5 index.json

ブラウザ検索用逆引き index。

`products.json` は完全性を優先し、`index.json` は検索性能を優先する。

index 対象:

- Definition 内の `priceQuery` / selector option filter 等から参照される属性
- `productFamily`
- `unit`
- `operation`
- `usagetype`
- CI が価格差判定に必要と認識した属性

Definition を解析して index 対象を自動生成する。

全属性を無条件で index 化しない。

### 11.6 Price Dimension の配置

Price Dimension は Product 内へ埋め込む。

初期版では Products と Dimensions を別ファイルへ分離しない。

### 11.7 ファイル分割

初期版:

```text
1 serviceCode x 1 Region = 1 products.json
```

巨大化した Price Source だけ将来 shard 可能な構造とする。

---

## 12. ブラウザ側データ取得

ブラウザは必要な Service / Region の Price DB だけ遅延取得する。

例:

```text
User adds Aurora
  -> service definition resolves AmazonRDS
  -> current Project Region resolves ap-northeast-1
  -> browser fetches AmazonRDS/ap-northeast-1 products/index
```

Price DB は原則メモリ上で利用し、Project データとして `localStorage` や Project JSON に保存しない。

HTTP browser cache の利用は許容する。

Project JSON には保存時の Price List date/version を記録できるが、復元後の料金は現在利用可能な Price DB から再計算する。

---

## 13. JSON Schema

Definition および Price DB の正式 validation schema を以下に置く。

```text
schemas/
  service.schema.json
  profile.schema.json
  component.schema.json
  pricing-manifest.schema.json
  pricing-products.schema.json
  pricing-index.schema.json
```

各 Definition は独自に `schemaVersion` を持つ。

Project JSON の schemaVersion とは別管理とする。

手動の `definitionVersion` は設けず、Definition 内容の履歴は Git で管理する。

---

## 14. CI Validation

Price DB 更新前に以下を検証する。

### 14.1 ERROR 条件

以下は更新を停止し、新 Price DB を公開しない。

- JSON Schema 不正
- Definition 間の参照先不存在
- `valueFrom` 参照先不存在
- Price Query が 0 SKU
- `singleSku` 期待なのに複数 SKU
- 未指定属性の差により価格が分岐する可能性を検出
- 既存料金単位の意味的変更
- Definition の Pricing Model と実データの tier/range 構造が不整合

### 14.2 WARNING 条件

以下は警告を残すが、原則自動更新を止めない。

- 新しい未知 attribute
- 新しい productFamily
- Definition から未参照の新料金カテゴリ
- tier/range 構造変更で Definition と矛盾しないもの
- 極端な価格変動

極端な価格変動の初期 heuristic は、概ね 10 倍以上または 1/10 以下を目安とする。

### 14.3 INFO

通常の価格値変更は INFO とする。

例:

```text
AmazonEC2 / ap-northeast-1
changed dimensions: 127
price increases: 4
price decreases: 123
```

価格改定そのものは異常とみなさない。

### 14.4 料金差に影響する未知属性

単なる未知属性追加は WARNING だが、既存の既知条件が同じにもかかわらず、未知属性だけが異なり価格が分岐する場合は ERROR とする。

CI レポートに差分属性名を表示する。

### 14.5 Golden Cases

代表的な料金ケースを回帰テストとして持つ。

例:

- EC2 / Tokyo / Linux / m7i.large / 1 instance / 730h
- RDS / PostgreSQL / db.t4g.medium / storage
- S3 / Standard / specified storage and requests

固定金額そのものを主要 assertion とせず、以下を中心に検証する。

- Query が一意に解決できる
- 期待 unit に解決できる
- expected Pricing Model path を通る
- usage が正しく適用される
- 結果が妥当な数値になる

---

## 15. GitHub Actions 更新戦略

### 15.1 Workflow 分離

以下を別 workflow とする。

```text
Application CI
  - push / pull_request

Price Update Workflow
  - schedule
  - workflow_dispatch
```

Price Update commit 自身で無限再実行しない構造とする。

### 15.2 更新確認頻度

1日1回を基本とする。

ただし最初に AWS metadata / version / publicationDate を確認し、変更がない Price Source は巨大 JSON を取得しない。

### 15.3 差分更新

変更のあった `serviceCode` のみ再取得・再生成する。

対応 Region のみ処理する。

### 15.4 Region 管理

アプリ全体の対応 Region 一覧を共通設定として管理する。

Service Definition ごとに Region 一覧を重複保持しない。

### 15.5 generated data の Git 管理

`pricing/generated/` は main branch に commit する。

理由:

- 過去価格差分を Git で追跡できる
- ローカル開発時にもそのまま利用できる
- Pages 公開内容と repository 状態を対応させやすい
- 問題調査時の再現性が高い

Price Update commit 形式例:

```text
chore(pricing): update AmazonRDS price data 2026-10-04
```

commit metadata / body へ以下を記録できるようにする。

- AWS source version
- publicationDate
- changed SKU / dimension count
- price increase count
- price decrease count
- new attributes
- warnings

### 15.6 workflow_dispatch

手動強制更新を可能にする。

将来的に以下の入力を持てるようにする。

- serviceCode
- region
- force

### 15.7 Pull Request

通常の PR CI では AWS 最新 Price List を毎回取得しない。

既存 `pricing/generated` に対して Definition の validation / regression test を行う。

新しい `serviceCode` を追加した PR のみ、その Price Source を AWS から一時取得して検証できるようにする。

PR validation 用一時データを自動 commit しない。

---

## 16. 未収録サービス追加時の原則

新サービス追加時に既存共通コードの修正を極力不要とする。

理想的な追加作業:

```text
1. services/<service>/service.json を追加
2. profiles/*.json を追加
3. components/*.json を追加
4. JSON Schema validation
5. PR CI が Price Source と Query を検証
6. merge
7. Price Update Workflow が正式 Price DB を生成
8. GitHub Pages へ反映
```

汎用 Pricing Engine / UI Renderer / Price DB builder に service 名による `if/else` を追加する運用は避ける。

宣言 DSL で表現不能なケースだけ adapter を追加する。

---

## 17. 現行モックからの移行方針

現行 `app.js` では `serviceDefs` 内に UI 定義、ダミー価格、defaultConfig 等が混在し、`priceForCell()` や `summaryLines()` でも service 名による分岐が存在する。

本実装では以下へ段階的に分離する。

```text
src/
  app.js
  pricing-engine.js
  price-data-loader.js
  service-loader.js
  ui-renderer.js
  project-store.js

services/
  ...

pricing/generated/
  ...

tools/
  build-pricing.py

schemas/
  ...
```

最終的には、新 Service 追加時に `app.js` / `pricing-engine.js` / `ui-renderer.js` を原則変更しないことを目標とする。

---

## 18. 現時点で確定した設計判断

本書作成時点で以下を確定事項とする。

1. GitHub Pages + GitHub Actions + 静的 Price DB を基本ホスティング構成とする。
2. AWS Public Price List JSON を料金正本とする。
3. 元巨大 JSON は Actions 上だけで一時使用する。
4. Price Data と UI / Service Definition を分離する。
5. 採用 SKU の価格関連属性は原則すべて保持する。
6. Service / Profile / Pricing Component の3階層とする。
7. Price Source 単位は AWS serviceCode × Region とする。
8. App Service と AWS serviceCode の 1:1 対応は要求しない。
9. selector / usageInput / fixedFilter を分離する。
10. UI input は Definition から汎用生成する。
11. priceData 由来 selector を優先する。
12. 値参照は `value` / `valueFrom` とする。
13. Price Query は汎用 filter DSL とする。
14. Pricing Model の基本は `unit` / `tiered` とする。
15. 任意式は許可しない。
16. 特殊ケースのみ adapter を許可する。
17. Price Dimension を料金計算の最小単位とする。
18. Component / Service / Plan は合算で構成する。
19. Account-level Free Tier は対象外とする。
20. `pricing/generated` は manifest / products / index に分ける。
21. AWS 原値は可能な限り文字列で保持する。
22. index 対象は Definition から自動生成する。
23. CI で AWS 側の構造・属性・価格体系変化を検出する。
24. ERROR 時は新 Price DB を公開しない。
25. Price Update は metadata 先行確認、差分取得、日次実行とする。
26. generated Price DB は main branch に commit する。
27. Application CI と Price Update Workflow を分離する。
28. Definition / Price DB の JSON Schema を正式 validation 仕様とする。

---

## 19. 次に決定する事項

次の仕様検討では、未収録サービス追加の正式ワークフローを定義する。

特に以下を決める。

- 人間 / ChatGPT / GitHub Actions の役割分担
- AWS Pricing Calculator UI を調査して Definition を生成する手順
- Public Price List と Pricing Calculator UI の整合確認方法
- 新 Service Definition の自動生成可能範囲
- 自動生成後に必要な validation / review
- Service Definition の追加から PR / merge / Price DB generation までの標準手順
