# Pricing Architecture Specification

最終更新: 2026-10-04

本書はAWSPricingCalculator_forTAEの料金基盤・Service Definition・Price DB・Pricing Engine・検証・更新運用の正本とする。

ユーザーから見たProject/Plan/比較/UI/保存・復元/PDF/CSVの挙動は `docs/SPEC.md` を正本とする。
過去の `PRICING_ARCHITECTURE_DECISIONS_*` は設計検討履歴であり、現行仕様の正本ではない。

---

## 1. 目的と基本原則

### 1.1 料金正本

料金計算の正本はAWS Public Price List JSONとする。
AWS Pricing Calculator UIは、入力項目・依存関係・初期値・primary/advanced区分等を理解する補助情報源として利用するが、料金値の正本にはしない。

### 1.2 ホスティング

- Frontend: GitHub Pages
- Backend application server: なし
- Database server: なし
- Price update/build: GitHub Actions
- Project persistence: browser localStorage
- Formal backup/restore: Project JSON
- PDF/CSV: browser side

### 1.3 対象料金

- USD
- On-Demand
- Tax excluded
- Reserved Instances対象外
- Savings Plans対象外
- Spot対象外
- 為替換算対象外
- Free Tier / free allowanceは計算へ反映しない
- Tier pricingは段階計算しない

Tier pricingが存在する場合は、既知のfree allowance dimensionを除外したうえで、最小の `beginRange` を持つ通常有料dimensionの単価を全使用量へ適用する。

### 1.4 保守的概算

本ツールは初期設計比較用であり、アカウント・組織・利用履歴等を必要とする請求条件を完全再現しない。

計算しない条件が実額を下げる方向ならnotice、実額を上げる可能性があるならwarningとしてPricing Limitationを表示する。

### 1.5 任意コード禁止

Service Definition内に任意JavaScript式を書かない。
Pricing Query、Calculation、Condition、Normalizationは限定DSLで表現する。

DSLで表現不能な例外だけ `adapter.js` を許可する。

---

## 2. 論理モデル

```text
Service
  -> Profile
      -> Pricing Component
          -> AWS Product / SKU
              -> On-Demand Term
                  -> Price Dimension
```

### 2.1 Service

ユーザーが認識する見積単位。
AWS `serviceCode` と1:1である必要はない。

例:

```text
Price Source: AmazonRDS
  - App Service: RDS
  - App Service: Aurora
```

### 2.2 Profile

同じServiceの中で、Component構成または料金方式が大きく変わる利用方式。

単なるinstance family、engine、storage class等、同じComponent構造内でSKU属性が変わるだけならselectorで表現し、Profileを増やさない。

### 2.3 Pricing Component

1つの課金メーターを表す。

以下が異なる場合はComponent分割を優先する。

- usage unit
- Price Query
- 個別入力可能なusage
- billing group
- 独立した料金行としてユーザーへ示す必要性

### 2.4 selector / usageInput / fixedFilter

- selector: 何を使うか。SKU/Dimension選択へ影響する
- usageInput: どれだけ使うか
- fixedFilter: 常に固定する料金選択条件

複数Componentへ共通に影響するselectorはProfileへ置く。

---

## 3. Service Definition package

標準構成:

```text
services/
  <serviceId>/
    service.json
    profiles/
      <profileId>.json
    components/
      <componentId>.json
    golden/
      ...
    coverage.json
    adapter.js          # 必要な場合のみ
```

### 3.1 ID規則

IDは原則以下とする。

```text
^[a-z][a-z0-9-]*$
```

以下を一致させる。

- `services/<serviceId>` と `service.json.id`
- `profiles/<profileId>.json` と内部 `id`
- `components/<componentId>.json` と内部 `id`

package外のDefinition参照は禁止する。

### 3.2 service.json

概念例:

```json
{
  "schemaVersion": 1,
  "id": "aurora",
  "label": "Amazon Aurora",
  "priceSource": {"serviceCode": "AmazonRDS"},
  "profiles": ["provisioned", "serverless-v2"],
  "defaultProfile": "provisioned"
}
```

価格値そのものは持たない。

### 3.3 profile.json

Profile selector、fixed filter、Component一覧を持つ。

### 3.4 component.json

主に以下を持つ。

- selectors
- usageInputs
- fixedFilters
- priceQuery
- calculation
- enabledWhen
- limitations
- UI metadata

### 3.5 Package completeness

CIで以下を検証する。

- service -> profile参照
- profile -> component参照
- ファイル名とID整合
- 未参照Definition
- duplicate input ID
- package外参照

---

## 4. JSON Schema

共通Schemaは中央管理する。

```text
schemas/
  service-definition/
    service.schema.json
    profile.schema.json
    component.schema.json
    golden.schema.json
    coverage.schema.json
  project.schema.json
  pricing/
    manifest.schema.json
    build-manifest.schema.json
    products.schema.json
    index.schema.json
```

主要objectは原則 `additionalProperties: false` とする。

Service/Profile/Component等はそれぞれ `schemaVersion` を持てる。
Project schemaVersion、Price DB schemaVersionとは独立して進化させる。

---

## 5. 値参照とCondition DSL

### 5.1 value / valueFrom

1つの値指定で `value` と `valueFrom` を同時指定しない。

正式な `valueFrom` namespace:

- `project.*`
- `profile.*`
- `component.*`

任意deep pathやJavaScript式は許可しない。

### 5.2 enabledWhen

Componentおよび必要なinputに限定条件を指定できる。

論理演算:

- `all`
- `any`
- `not`

leaf演算子:

- `eq`
- `neq`
- `in`
- `notIn`
- `exists`
- `notExists`

型変換は行わず、文字列比較はcase-sensitiveとする。
`neq`はfieldが存在し、かつ値が異なる場合だけ成立する。

### 5.3 依存関係

- 循環依存は禁止
- CIで依存グラフをDAG検証する
- Component間の直接参照は初期版では禁止する
- 複数Componentに影響する値はProfile selectorへ昇格する

`enabledWhen=false` のComponent/inputはruntime計算contextから除外するが、Project state内の既存値は保持してよい。

### 5.4 selector候補依存

selector候補の依存は `options.filters` で表す。
`enabledWhen` と候補filterを混同しない。

---

## 6. Price Query DSL

SKU選択とPrice Dimension選択を分離する。

```json
{
  "priceQuery": {
    "productFilters": [
      {"field": "productFamily", "op": "eq", "value": "Database Instance"},
      {"field": "attributes.databaseEngine", "op": "eq", "valueFrom": "profile.engine"},
      {"field": "attributes.instanceType", "op": "eq", "valueFrom": "component.instanceType"}
    ],
    "dimensionFilters": [
      {"field": "unit", "op": "eq", "value": "Hrs"}
    ],
    "expect": "singleSku"
  }
}
```

### 6.1 Product filter

正式field:

- `productFamily`
- `operation`
- `usageType`
- `attributes.<name>`

`sku`固定依存は原則禁止・review対象とする。

演算子:

- `eq`
- `neq`
- `in`
- `notIn`
- `exists`
- `notExists`

Product filtersは初期版AND-onlyとする。
regex / contains / startsWith / endsWithは採用しない。

`in/notIn`はstatic配列に限定する。

### 6.2 Dimension filter

正式fieldは初期版で以下に限定する。

- `unit`
- `description`
- `beginRange`
- `endRange`

`rateCode`固定依存は原則禁止する。

### 6.3 Resolution

```text
serviceCode + region の products.json
-> productFilters
-> SKU cardinality
-> On-Demand Term
-> dimensionFilters
-> Dimension policy
```

`expect`の正式値は初期版 `singleSku` のみ。

- 0 SKU -> `SKU_NOT_FOUND`
- 1 SKU -> 正常
- 2+ SKU -> `AMBIGUOUS_SKU`

先頭SKU、類似SKU、最安SKU等へのfallbackは禁止する。

---

## 7. Price Dimension解決

### 7.1 基本

通常は1 Component -> 1 SKU -> 1 billable Price Dimensionとする。

### 7.2 Free allowance dimension

Free Tier / free allowanceと信頼して識別できる0円dimensionは料金計算から除外し、通常の最初の有料dimensionを使用する。

単に `pricePerUnit = 0` という理由だけでfree allowanceと判定しない。

### 7.3 Tier

Tier構造を検出しても段階積算しない。

free allowanceを除いた通常有料tierのうち、最小 `beginRange` のdimensionを全usageへ適用し、`tier-pricing` Limitationを付与する。

### 7.4 複数paid dimension

Tierでもfree allowanceでもない異種paid dimensionsが複数残る場合、自動合算・先頭採用をしない。

`AMBIGUOUS_PRICE_DIMENSION` 相当のERRORとし、Component分割、Query改善、限定dimension filter等でDefinitionを修正する。

---

## 8. Calculation DSL

### 8.1 model

初期版の正式modelは `unit` のみ。
`tiered` modelは持たない。

### 8.2 usage

```json
{
  "calculation": {
    "model": "unit",
    "usage": {
      "sources": [
        {"valueFrom": "component.hoursPerMonth"},
        {"valueFrom": "component.quantity"}
      ],
      "combine": "multiply"
    },
    "transforms": [],
    "outputUnit": "Hrs"
  }
}
```

複数sourceは `multiply` を正式対応とする。
単純なusage加算が必要な場合は、まずComponent分割を検討する。

個々のusage sourceに対して、他sourceとの乗算前に限定的なtransformを適用できる。現行runtimeで正式に使用するsource-level primitiveは `subtract`、`minimum`、`scale`、`rounding(mode=ceil)` とする。これは、Lambdaのリクエスト単位控除やEventBridgeの「1イベントごとに64 KB/8 KBへ切り上げてから件数を掛ける」ようなper-item課金を、aggregate後の誤った丸めにせず表現するために用いる。

### 8.3 transforms

順序付きarrayとして適用する。

初期primitive:

- `minimum`
- `increment`（increment単位へceil）
- `rounding`（初期正式modeは `ceil`）
- `scale`
- `unitConversion`

transform parameterは定数とし、任意式や動的factor参照を許可しない。

### 8.4 unit

`calculation.outputUnit` と解決したPrice Dimension `unit` の整合をCI/runtimeで検証する。

### 8.5 精度

価格・usage・transformはDecimal相当の高精度演算を用いる。
金額は途中丸めしない。

---

## 9. Billing semantics

月間aggregate usageから決定可能な以下の条件はDSLで表現できる。

- minimum billable amount
- billing increment
- ceil rounding
- scale
- unit conversion

minimum storage duration、early deletion、セッション回数、開始停止履歴、ライフサイクルイベント等、月間aggregateだけから再構成できない条件は計算しない。

---

## 10. Pricing Limitation

中央registryを持つ。

代表ID:

- `tier-pricing`
- `free-tier`
- `minimum-storage-duration`
- `early-deletion`
- `lifecycle-event-charge`
- `organization-usage-aggregation`
- `account-specific-discount`

主な属性:

- id
- severity: notice / warning
- impactDirection: estimate-may-be-higher / estimate-may-be-lower / unknown
- message

Tier等、Price Dataから信頼して検出できるものは自動付与する。
Price Listだけで判定できない意味上の制約はDefinitionで宣言する。

LimitationはProject JSONへ保存せず、現在のDefinition + Price DBから再導出する。

---

## 11. Price DB publication model

公開構造:

```text
pricing/generated/
  manifest.json
  builds/
    <buildId>/
      build-manifest.json
      sources/
        <serviceCode>/
          <region>/
            products.json
      indexes/
        <serviceCode>/
          <region>/
            index.json
```

### 11.1 manifest.json

可変なトップmanifestはactive buildだけを指す。

```json
{
  "schemaVersion": 1,
  "activeBuildId": "20261004T012300Z-a1b2c3d4",
  "publicationDate": "2026-10-04T01:23:00Z"
}
```

service listや価格本体は埋め込まない。

### 11.2 build-manifest.json

build全体のmetadataとserviceCode/region別resource pathを持つ。

主な情報:

- schemaVersion
- buildId
- generatedAt
- publicationDate
- currency
- sources map
- optional SHA256 / bytes

### 11.3 build consistency

Price DB全体を1世代として扱う。
serviceCode単位の独立active generationを持たない。

新buildを完全生成・検証した後、最後に `manifest.json` のactiveBuildIdを更新する。
manifest更新を論理publish commit pointとする。

### 11.4 retention

working treeは初期版でcurrent + previousの2世代を保持する。
それ以前はGit履歴から復元可能とする。

---

## 12. products.json

1 Product = 1 SKU。

概念形:

```json
{
  "schemaVersion": 1,
  "buildId": "...",
  "serviceCode": "AmazonEC2",
  "region": "ap-northeast-1",
  "products": [
    {
      "sku": "ABC123",
      "productFamily": "Compute Instance",
      "operation": "RunInstances",
      "usageType": "APN1-BoxUsage:m7i.large",
      "attributes": {
        "instanceType": "m7i.large",
        "operatingSystem": "Linux",
        "tenancy": "Shared"
      },
      "terms": {
        "onDemand": [
          {
            "offerTermCode": "JRTCKXETXF",
            "effectiveDate": "...",
            "priceDimensions": [
              {
                "rateCode": "...",
                "description": "...",
                "unit": "Hrs",
                "beginRange": "0",
                "endRange": "Inf",
                "pricePerUnit": {"USD": "0.1234000000"}
              }
            ]
          }
        ]
      }
    }
  ]
}
```

`pricePerUnit` / `beginRange` / `endRange`は文字列で保持する。
On-Demandのみ生成対象とする。

複数On-Demand Termを配列順で選んではならない。
生成時にeffectiveDate等からcurrent termを選定し、想定外の複数active termはCI ERRORとする。

---

## 13. index.json / selector candidate

`index.json` はUI候補取得用の派生索引であり、料金正本ではない。

基本構造:

```json
{
  "attributes": {
    "instanceType": ["m7i.large", "m7i.xlarge"],
    "operatingSystem": ["Linux", "Windows"]
  }
}
```

候補確定フロー:

```text
indexから広い候補
-> options.filters
-> products.jsonで実在Productを確認
-> distinct
-> stable/natural sort
```

cross-product indexは初期版では生成しない。
親selector変更で現在値が候補外になっても別値へ自動変更しない。

`index.json` は `products.json` から自動生成し、人手編集しない。

---

## 14. Price Data normalization / coverage

### 14.1 coverage.json

各Service packageで、対象On-Demand料金カテゴリを以下に分類する。

- mapped
- ignored
- unresolved

完成PRでは `unresolved = 0` を必須とする。

mappedは `componentId` を必須とする。
ignoredはreasonを必須とし、可能ならPricing Limitation IDを使う。

### 14.2 category identity

基本key:

- productFamily
- operation
- usageTypeClass
- unit
- 必要なdiscriminators

SKU、rateCode、pricePerUnit、tier rangeはcategory identityに含めない。

### 14.3 usageTypeClass normalizer

normalizerはgeneric処理 + serviceCode固有ruleの2段階。

generic処理はregion prefix除去等、安全なものだけに限定する。
instance type等のSKU固有suffix除去はserviceCode固有の宣言ruleで行う。

任意JavaScriptは禁止する。

normalizer後のcategoryについてunit / operation / Dimension shape等のhomogeneityを検証する。
価格差だけではcategoryを分割しない。

Detected inventoryはCI artifactとして生成し、原則commitしない。

---

## 15. Validation layering

Validationを4層に分ける。

### Layer 1: Schema

- JSON Schema
- required field
- type
- enum
- additionalProperties
- ID形式

### Layer 2: Reference / Dependency

- Profile/Component参照
- valueFrom参照
- duplicate ID
- file ID整合
- dependency DAG
- default静的妥当性

### Layer 3: Price Data semantics

- serviceCode/region存在
- selector attribute存在
- singleSku
- Price Dimension解決
- outputUnit整合
- coverage
- Limitation
- unmapped pricing category

### Layer 4: Golden / behavior

- representative selector variation
- usage variation
- all Profiles
- enabledWhen true/false
- billing transform boundary
- Tier/Free policy
- Component amount / Service total

新Service PRはLayer 1〜4のERROR 0件をmerge条件とする。

---

## 16. Golden Case

Goldenは最終金額だけでなく解決経路を検証する。

```text
input
-> expected SKU count
-> selected Product semantic attributes
-> Dimension
-> Limitation
-> billing quantity
-> Component amount
-> Service total
```

SKU ID自体はnormative assertionにしない。

Expected pricingはProduction Pricing Engineと同じ実装から生成してはならない。
独立したraw semantic verifierを使う。

GoldenはStructure GoldenとPrice Verificationを分け、単価だけの変更で構造テストを不必要に壊さない。

---

## 17. Price update drift classification

候補buildを現在のactive buildと比較して以下へ分類する。

### PRICE_ONLY

semantic resolutionは同じで単価のみ変化。
-> publish可能。

### STRUCTURE_WARNING

新selector値、新SKU、tier range変更等、既存Queryは安全に解決できる構造変化。
-> publish可能 + warning。

### STRUCTURE_BREAKING

例:

- 0 / 2+ SKU
- unit変更
- 必要attribute消失
- non-tier multiple paid dimensions
- mapped category unresolved化
- free/paidを安全に識別できない

-> candidateをpublishしない。現在のactive buildを維持する。

単価変動率が大きいことだけを理由にpublish blockしない。

---

## 18. GitHub Actions workflow

Price Update Workflow概念:

```text
check-source
-> download
-> normalize
-> inventory
-> validate-definitions
-> validate-price-data
-> run-golden
-> classify-change
-> build-price-db
-> publish
```

### 18.1 trigger

- schedule
- workflow_dispatch

Definition PR CIは別workflowとし、active manifestを更新しない。

### 18.2 source check

最初にAWS metadata/version/publicationDateを確認する。
変更がないPrice Sourceは巨大JSONを取得しない。

### 18.3 publish

`PRICE_ONLY` または `STRUCTURE_WARNING` かつERROR 0件のみpublish可能。

順序:

```text
builds/<newBuildId>/配置
-> retention
-> manifest更新
-> bot commit
-> Pages deploy
```

### 18.4 artifact

以下の分析report等をActions artifactとして保持できる。

- source metadata
- normalization report
- category inventory
- coverage report
- validation reports
- golden report
- change classification
- rate diff

### 18.5 concurrency

Price Updateは1本だけ実行するconcurrency groupを持つ。

---

## 19. Common CLI

PR CI、scheduled update、local developmentは同じNode.js CLIを使う。
GitHub Actions YAMLへ料金ロジックを書かない。

概念command:

```text
pricing-tool check-source
pricing-tool download
pricing-tool normalize
pricing-tool inventory
pricing-tool validate-definitions
pricing-tool validate-price-data
pricing-tool run-golden
pricing-tool classify-change
pricing-tool build
```

`publish` はrepository write権限を伴うためPricing CLIの責務外とする。

### 19.1 report format

各commandはmachine-readable JSON reportを正本とする。

共通issue例:

```json
{
  "severity": "error",
  "code": "AMBIGUOUS_SKU",
  "serviceId": "rds",
  "profileId": "provisioned",
  "componentId": "instance",
  "path": "priceQuery.productFilters",
  "message": "Expected one SKU but matched 3."
}
```

exit code:

- 0: success / warnings only
- 1: validation failure
- 2: tool/input/environment failure

`download` / `check-source` 以外は原則offline実行可能にする。

---

## 20. Implementation language / module boundary

CLIと共有Pricing CoreはNode.js / JavaScript ES Modulesを採用する。
初期版でTypeScriptやbundlerを必須にしない。

共有Pricing Coreに含める:

- filter evaluator
- condition evaluator
- Price Query
- Dimension resolution
- Tier/Free policy
- Calculation DSL
- Decimal handling
- runtime issue format

共有しない:

- AWS Price List download
- raw normalization
- category inventory generation
- Git operations
- GitHub Actions summary
- Browser DOM/localStorage/PDF
- Golden independent verifier

Pricing CoreはDOM、filesystem、networkへ依存させない。

概念構造:

```text
Browser-only layer
      -> Shared Pricing Core <- Node CLI layer
```

---

## 21. Browser runtime stores

### 21.1 PriceDataStore

1タブにつき1つ。

保持内容:

- pinned buildId
- build manifest
- products cache
- index cache
- in-flight Promise map
- resource status

cache key:

```text
buildId + serviceCode + region
```

同一resourceへの同時fetchは同じPromiseを共有する。
失敗Promiseはin-flight mapから除去してretry可能にする。

起動時:

```text
manifest.json
-> activeBuildId
-> build-manifest.json
-> PriceDataStore ready
```

同一タブ内でmanifestを再評価して別buildへ自動切替しない。
ページ再読み込み時に最新buildを採用する。

Price DBをlocalStorage / IndexedDBへ永続保存しない。

### 21.2 DefinitionStore

PriceDataStoreとは分離する。

責務:

- Catalog
- service/profile/component Definition load
- memory cache
- in-flight dedup
- 軽量runtime validation

Catalogだけ初期ロードし、Definition本体はService選択・編集時にlazy loadする。

### 21.3 Runtime status

Price Data resource状態:

- loading
- available
- stale
- unavailable
- invalid

Service Instance評価状態:

- loading
- ready
- warning
- unavailable
- invalid

局所resource failureは他Serviceへ波及させない。
ただしbuild-manifest自体がinvalidならbuild全体invalidとする。

---

## 22. Service Catalog

Catalogは `services/*/service.json` からCI/build時に自動生成する。
手書き一覧を正本として持たない。

CatalogにはService選択画面に必要な軽量metadataだけを持たせ、Profile/Component全Definitionは埋め込まない。

Definition pathはIDから機械的に解決する。

```text
services/<serviceId>/service.json
services/<serviceId>/profiles/<profileId>.json
services/<serviceId>/components/<componentId>.json
```

Catalog availabilityはDefinitionの正常性と、pinned build内のserviceCode/region resource存在からruntimeで導出する。

---

## 23. Project restore / migration

Project schema migrationとService Definition migrationを分ける。

自動migrationは意味が完全に同一の安全な変更だけに限定する。

許可例:

- service/profile/component/input rename
- exact selector value mapping
- Project構造schema migration

禁止:

- 類似SKUへの置換
- 廃止instance typeを似たinstance typeへ置換
- 料金意味の異なる自動変換

migrationは順次適用する。

```text
v1 -> v2 -> v3
```

Restore Reportでは `valid / warning / invalid` をService Instance単位で扱い、issue codeを安定化する。

未知Service等は部分復元し、データを可能な限り保持する。

---

## 24. Service onboarding

標準フロー:

```text
対象Service指定
-> current main確認
-> Public Price List機械解析
-> AWS Pricing/Docs調査
-> Pricing Calculator UI調査
-> Service/Profile/Component分解
-> coverage分類
-> Definition JSON
-> Golden Case
-> Layer 1-4 validation
-> branch / PR
-> human review / merge
```

Pricing Calculator UIは料金正本ではない。

全料金カテゴリを `mapped / ignored / unresolved` に分類する。
`ignored` は理由必須、完成PRでは `unresolved=0`。

adapterが必要な場合は、generic DSLで表現できない理由をPR reportへ明記する。

mergeは自動化しない。

---

## 25. Adapter

`adapter.js` は最後の手段とする。

禁止責務:

- DOM操作
- network access
- filesystem access
- Project state直接変更
- Price DB任意取得

入力->出力が明確なpure functionに近い限定料金変換だけを許可する。
Adapter存在Serviceはreview-requiredとしてCI Summaryへ明示する。

---

## 26. 実装開始時の推奨構造

```text
src/
  pricing/
    filter.js
    conditions.js
    price-query.js
    dimensions.js
    calculation.js
    decimal.js
    definition-loader.js

tools/
  pricing-cli/
    cli.js
    commands/
      check-source.js
      download.js
      normalize.js
      inventory.js
      validate-definitions.js
      validate-price-data.js
      run-golden.js
      classify-change.js
      build.js

services/
schemas/
pricing/generated/
```

`app.js` へPricing Engineを直接肥大化させない。

---

## 27. Design freeze

本書と `docs/SPEC.md` で主要仕様は確定済みとする。

実装中に以下を変えない軽微な詳細は、追加の仕様Decisionを作らず実装判断で決定してよい。

- class/function名
- module分割の細部
- logging format
- test helper
- internal library
- retry待機時間等の小規模定数

以下を変更する場合のみ仕様検討へ戻る。

- Project JSON互換性
- Service Definition schema/DSL意味論
- 料金計算結果の意味
- Tier/Free Tier等の対象範囲
- 主要UI操作フロー
- Price DB publication consistency
- restore/migration挙動
- fail-open / fail-closed方針

推奨実装順序:

```text
1. package.json / ES Modules / schemas
2. Shared Pricing Core
3. Node CLI / normalization / validation
4. Browser integration
5. GitHub Actions
6. initial Service Definitions
7. end-to-end verification
```
