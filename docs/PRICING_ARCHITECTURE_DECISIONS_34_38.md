# Pricing Architecture Specification — Decisions 34–38

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 34〜38で確定した selector option index、Price Query DSL、Calculation DSL、enabledWhen / dependency DSL、Service Definition validation layering を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 34 — index.json と selector候補生成

### 1.1 index.jsonの役割

`index.json` はUI向け候補値取得を高速化する派生索引であり、料金計算の正本ではない。

基本形は `attribute -> distinct values` とする。

```json
{
  "schemaVersion": 1,
  "buildId": "...",
  "serviceCode": "AmazonEC2",
  "region": "ap-northeast-1",
  "attributes": {
    "instanceType": ["m7i.large", "m7i.xlarge"],
    "operatingSystem": ["Linux", "Windows"],
    "tenancy": ["Shared", "Dedicated"]
  }
}
```

### 1.2 条件付き候補

`index.json`だけでselector候補を確定しない。

標準処理:

```text
indexからattribute候補取得
-> 現在のselector条件を適用
-> products.jsonで実在Productを確認
-> distinct化
-> stable sort
-> 候補表示
```

`indexに値が存在する`ことと`現在のselector組み合わせで利用可能`であることを区別する。

### 1.3 options.filters

Definition側の`options.filters`で依存selector条件を記述する。

```json
{
  "options": {
    "source": "priceData",
    "attribute": "instanceType",
    "filters": [
      {
        "field": "attributes.operatingSystem",
        "op": "eq",
        "valueFrom": "profile.operatingSystem"
      }
    ]
  }
}
```

### 1.4 cross-index

初期版では、複数attributeの組合せを事前展開したcross-indexを作らない。

候補依存の最終確認は`products.json`に対して行う。

### 1.5 sort

Price Data由来順序へ依存しない。

初期版では少なくとも安定したnatural sortを利用可能とし、必要な場合だけDefinition側で限定的なsort指定を持たせる。

### 1.6 value / label

Project stateへ保存する値はAWS Price Dataの意味値を`value`として扱う。

表示名が必要な場合はDefinition側のlabel変換で扱い、Price DB側へUI文言を埋め込まない。

### 1.7 現在値が候補外になった場合

既存選択値が依存条件変更によって候補外になっても、別値へ自動置換しない。

`invalid / unresolved`として再選択を要求する。

初回未選択状態ではDefinition defaultを適用可能とする。

### 1.8 default検証

Definition defaultが生成候補内に存在しない場合はCIエラー対象とする。

候補が無いため自動的に配列先頭値を選ぶ動作は禁止する。

### 1.9 index整合性

`index.json`は`products.json`から自動生成し、人手編集しない。

少なくとも以下をCIで保証する。

```text
index attribute values ⊆ productsの実属性値
```

Definitionが参照するpriceData attributeがindexに存在しない場合はERRORとする。

---

## 2. Decision 35 — Price Query DSL

### 2.1 Product filter演算子

初期版で許可する演算子:

- `eq`
- `neq`
- `in`
- `notIn`
- `exists`
- `notExists`

基本は`eq`とする。

regex / contains / startsWith / endsWith は初期版では実装しない。

### 2.2 value / valueFrom

1 filterでは`value`または`valueFrom`のどちらか一方だけを使用する。

`exists / notExists`はどちらも持たない。

`valueFrom`参照先は限定namespaceとする。

- `project.*`
- `profile.*`
- `component.*`

### 2.3 region

RegionはPrice Query filterに含めず、対象`serviceCode × region` Price DBを選択する段階で決定する。

### 2.4 field namespace

DefinitionはAWS raw JSONを直接参照せず、正規化Price DBの正式fieldだけを利用する。

Product側の代表field:

- `productFamily`
- `operation`
- `usageType`
- `attributes.<name>`

`sku`による固定filterは原則禁止し、例外利用時はreview対象とする。

### 2.5 in / notIn

`in / notIn`はstatic配列に限定する。

動的配列を`valueFrom`で受け取る機能は初期版では持たない。

### 2.6 AND-only

`productFilters`は初期版ではANDのみとする。

複雑なOR条件が必要な場合は、Component / Profile分割等を先に検討する。

### 2.7 productFilters / dimensionFilters分離

SKU選択条件とPrice Dimension選択条件を分離する。

```json
{
  "priceQuery": {
    "productFilters": [
      {"field": "productFamily", "op": "eq", "value": "Database Instance"}
    ],
    "dimensionFilters": [
      {"field": "unit", "op": "eq", "value": "Hrs"}
    ],
    "expect": "singleSku"
  }
}
```

Dimension側の正式fieldは初期版では以下程度に限定する。

- `unit`
- `description`
- `beginRange`
- `endRange`

`rateCode`固定依存は原則禁止する。

### 2.8 Query実行順序

```text
serviceCode / region の products.json
-> productFilters
-> Product候補
-> expect: singleSku
-> On-Demand Term
-> dimensionFilters
-> Price Dimension候補
-> Dimension解決ルール
```

### 2.9 expect

初期版では`expect`を残してよいが、許容値は`singleSku`のみとする。

- 0件: `SKU_NOT_FOUND`
- 1件: PASS
- 2件以上: `AMBIGUOUS_SKU`

### 2.10 欠損field

通常filterではfield欠損を一致扱いにしない。

`neq`も、fieldが存在し、かつ異なる場合だけ成立する。

欠損自体を条件化する場合は`exists / notExists`を利用する。

### 2.11 比較規則

暗黙型変換を行わない。

文字列比較はcase-sensitiveとする。

### 2.12 evaluator共通化

selector `options.filters`とPrice Query `productFilters`は同じfilter evaluatorを使う。

Dimension filterだけ別namespaceに限定する。

---

## 3. Decision 36 — Calculation DSL

### 3.1 model

初期版の正式`calculation.model`は`unit`のみとする。

Tier Price Dimensionが存在しても、Decision 22に従いfirst/base paid dimensionを用いた`unit`計算として扱う。

### 3.2 usage

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

`valueFrom`は限定namespaceのみを参照する。

### 3.3 combine

初期版では`multiply`のみ正式対応する。

単一sourceでは`combine`を省略可能とする。

`add`等は導入せず、まずComponent分割を検討する。

### 3.4 transform pipeline

`transforms`は順序付き配列とし、配列順に適用する。

初期primitive:

- `minimum`
- `increment`
- `rounding` (`ceil`のみ)
- `scale`
- `unitConversion`

任意数式は禁止する。

### 3.5 minimum

```json
{"type": "minimum", "value": "60"}
```

usageがminimum未満ならminimumへ引き上げる。

### 3.6 increment

```json
{"type": "increment", "value": "60"}
```

incrementは常に指定刻みへceilする。

概念:

```text
ceil(usage / increment) * increment
```

式自体はDefinitionへ記述しない。

### 3.7 rounding

初期版は`ceil`のみ。

```json
{"type": "rounding", "mode": "ceil"}
```

### 3.8 scale

```json
{"type": "scale", "factor": "0.000001"}
```

usageへ固定Decimal factorを乗じる。

### 3.9 unitConversion

```json
{
  "type": "unitConversion",
  "from": "seconds",
  "to": "Hrs",
  "factor": "0.00027777777777777778"
}
```

計算上はscaleに近いが、意味上の単位変換として区別する。

### 3.10 unit metadata

`usageInput`は必要に応じて`unit`を持てる。

Calculationは`outputUnit`を持ち、CIでPrice Dimension `unit`と整合することを確認する。

### 3.11 transform parameter

transform parameterはDefinition上の定数だけを許可する。

動的factor、条件付きtransformは初期版では禁止する。

### 3.12 runtime result

Component計算結果として少なくとも以下を持つ。

- `rawUsage`
- `billingQuantity`
- `billingUnit`
- `unitPriceUsd`
- `amountUsd`

派生計算結果はProject JSONへ保存しない。

### 3.13 Decimal

usage / factor / minimum / increment / unitPrice / amount等の内部計算はDecimal相当で行い、中間丸めしない。

### 3.14 対象外

イベント履歴・セッション回数等が必要な料金条件はCalculation DSLで無理に再現せずPricing Limitationとして扱う。

---

## 4. Decision 37 — enabledWhen と入力依存関係DSL

### 4.1 enabledWhen

Componentおよびinputに限定条件DSLを指定できる。

```json
{
  "enabledWhen": {
    "all": [
      {"field": "profile.engineMode", "op": "eq", "value": "provisioned"}
    ]
  }
}
```

### 4.2 論理演算

初期版:

- `all`
- `any`
- `not`

leaf演算子はPrice Query系と共通の以下とする。

- `eq`
- `neq`
- `in`
- `notIn`
- `exists`
- `notExists`

### 4.3 namespace

条件参照先:

- `project.*`
- `profile.*`
- `component.*`

Component間の直接参照は初期版では禁止する。

複数Componentへ影響するselectorはProfile selectorへ昇格する。

### 4.4 enabled=falseの意味

`enabledWhen=false`なら以下を一体として無効化する。

- UI入力
- Price Query
- Calculation
- Plan totalへの加算

無効化と`usage=0`は別状態とする。

### 4.5 hiddenとの分離

hidden/advanced UI表示は、Componentやinput自体の有効・無効とは別概念とする。

### 4.6 値保持

一時的に無効化されたinput / Componentの値はProject stateから即削除しない。

再び有効になった場合は意味が同一なら以前の値を復元可能とする。

無効中の値はruntime calculation contextへ渡さない。

### 4.7 input enabledWhen

selector / usageInput単位にも`enabledWhen`を指定できる。

### 4.8 visibleWhen

初期版では別の`visibleWhen`を導入しない。

計算意味の正本は`enabledWhen`とする。

### 4.9 selector候補依存

selector候補の絞り込みは`enabledWhen`ではなく`options.filters`を利用する。

役割:

```text
enabledWhen = input / Componentが存在するか
options.filters = 候補値をどう絞るか
```

### 4.10 reevaluation順序

入力変更後の標準再評価順:

```text
enabledWhen
-> selector option filters
-> 現在値validity
-> Price Query
-> Calculation
```

### 4.11 未設定値

通常条件で未設定値はfalseとする。

`neq`もfield存在時だけ成立する。

### 4.12 nesting

条件式のネスト深度には実装上限を設ける。

初期版は最大3階層程度を想定する。

### 4.13 循環依存

依存グラフはDAGでなければならない。

自己参照、循環参照、禁止されたComponent横断参照はCI ERRORとする。

評価順はtopological sortで決定し、Definition記述順へ依存しない。

### 4.14 数値比較

`gt / gte / lt / lte`は初期版では実装しない。

booleanは通常の`eq`で扱う。

---

## 5. Decision 38 — Service Definition JSON Schema と Validation Layer

### 5.1 4層Validation

Service Definition validationを以下の4層に分ける。

```text
Layer 1: Schema Validation
Layer 2: Reference / Dependency Validation
Layer 3: Price Data Semantic Validation
Layer 4: Golden / Runtime Behavior Validation
```

### 5.2 Layer 1 — Schema

対象:

- `services/*/service.json`
- `services/*/profiles/*.json`
- `services/*/components/*.json`

検証例:

- 必須field欠落
- 未知field
- 型違い
- enum外
- 不正ID形式

主要objectは原則`additionalProperties: false`とする。

### 5.3 ID形式

Service / Profile / Component / input IDは概ね以下へ統一する。

```text
^[a-z][a-z0-9-]*$
```

表示名は`label`へ分離する。

### 5.4 schemaVersion

Service / Profile / Componentそれぞれが`schemaVersion`を持ち、種別ごとに独立して進化可能とする。

### 5.5 Layer 2 — Reference / Dependency

検証対象:

- `profiles[]`
- `defaultProfile`
- `components[]`
- selector / usageInput IDs
- `valueFrom`
- `enabledWhen`
- `options.filters`

存在しない参照、重複ID、依存cycleをERRORとする。

同一Component内でselector IDとusageInput IDは共通namespaceとして重複禁止とする。

### 5.6 default検証

static inputのdefaultは型・範囲・static optionsに適合することをLayer 1/2で確認する。

priceData由来defaultの実在性はLayer 3で確認する。

### 5.7 Layer 3 — Price Data Semantic Validation

対象Price DBを用いて以下を検証する。

- serviceCode存在
- selector attribute存在
- product filter field存在
- `singleSku`
- Price Dimension解決
- output unit整合
- Limitation
- pricing category coverage

新サービス追加時はtemporary Price DBを利用してよい。

### 5.8 singleSku

- 0 SKU: ERROR
- 1 SKU: PASS
- 2+ SKU: ERROR

Price Data上の実在Product組み合わせを基準にvalidationする。

全Cartesian productを機械的に生成しない。

### 5.9 Price Dimension

SKU解決後、On-Demand Term / dimensionFilters / Dimension resolution ruleを適用し、正常なbillable Dimensionへ到達できることを確認する。

異種Paid Dimensionが複数残る場合はERRORとする。

### 5.10 unit

`calculation.outputUnit`と選択されたPrice Dimension `unit`が一致することを検証する。

### 5.11 Calculation静的検証

- transform type
- minimum
- increment
- scale factor
- unitConversion factor

等の構文・値域を検証する。

### 5.12 Limitation

Tier等、Price Dataから機械的に判定可能なLimitationが必要なのに付与されない場合は`LIMITATION_MISSING`等で検出する。

### 5.13 pricing category coverage

対象serviceCode × regionの料金カテゴリを`mapped / ignored / unresolved`へ分類する。

新サービス追加完了時に`unresolved`を残さない。

`ignored`には理由を必須とする。

### 5.14 Layer 4 — Golden / behavior

Decision 30のGolden Caseを実行し、少なくとも以下を検証する。

- Profile coverage
- Component coverage
- conditional branch
- SKU resolution
- Dimension resolution
- billing quantity
- amount
- Limitation
- invalid/error cases

### 5.15 merge condition

新サービスPRはLayer 1〜4のERROR 0件をmerge条件とする。

Warningはレビュー対象として許容可能とする。

### 5.16 machine-readable issue

Validation結果は安定したcodeを持つ。

代表例:

- `SCHEMA_INVALID`
- `UNKNOWN_PROFILE`
- `UNKNOWN_COMPONENT`
- `DUPLICATE_INPUT_ID`
- `INVALID_REFERENCE`
- `DEPENDENCY_CYCLE`
- `INVALID_DEFAULT`
- `UNKNOWN_PRICE_ATTRIBUTE`
- `SKU_NOT_FOUND`
- `AMBIGUOUS_SKU`
- `PRICE_DIMENSION_NOT_FOUND`
- `AMBIGUOUS_PRICE_DIMENSION`
- `UNIT_MISMATCH`
- `LIMITATION_MISSING`
- `UNMAPPED_PRICING_CATEGORY`
- `GOLDEN_CASE_FAILED`

Severityは`info / warning / error`とする。

### 5.17 CI Summary

Validation結果はlayer別に表示する。

```text
Schema          PASS
References      PASS
Dependencies    PASS
Price Data      PASS
Golden Cases    PASS
Warnings: 2
Errors: 0
```

### 5.18 runtime validation

Browser runtimeではCI相当の全検証を繰り返さない。

ただし以下の致命条件は再確認する。

- schemaVersion
- buildId
- required refs
- 0 / 2+ SKU
- Dimension解決
- unit mismatch

runtimeでも問題を検出した場合は`invalid`として扱う。
